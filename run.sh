#!/usr/bin/env bash
#
# Sobe o sistema inteiro com um comando: banco e API em containers, frontend nesta máquina.
# Precisa só de Docker e Node — o SDK do .NET fica para os testes e para rodar a API fora.
#
#   ./run.sh            banco e API no Docker (API na 5062), frontend na 5173
#   ./run.sh --reset    apaga o volume do banco antes, recriando do zero
#
# Com tudo no ar, o terminal fica escutando teclas:
#
#   r        reconstrói a imagem da API com o código atual e reinicia API e frontend
#   z        zera o banco: esvazia as três tabelas, sem seed. O esquema fica
#   q        encerra (o mesmo que Ctrl+C)
#
# Ctrl+C derruba tudo o que este script subiu, banco incluído. O volume fica: os dados
# continuam lá na próxima subida. Para recriar o banco com o seed, --reset.

set -euo pipefail

cd "$(dirname "$0")"

LOGS="$PWD/.run"
WEB_URL="http://localhost:5173"
ESPERA=90

azul() { printf '\033[1;34m%s\033[0m\n' "$1"; }
erro() { printf '\033[1;31m%s\033[0m\n' "$1" >&2; }

precisa() {
    command -v "$1" >/dev/null 2>&1 || { erro "Falta $1. $2"; exit 1; }
}

# O .env não é lido com `source`: o valor de CONNECTION_STRING tem `;`, que para o bash é fim de
# comando — a variável chegaria cortada em "Host=localhost" e a API subiria sem senha. Quem lê o
# arquivo inteiro é o Program.cs; aqui só se pesca o que o psql precisa.
env_de() { sed -n "s/^$1=//p" .env | tail -1; }

# O psql é o de dentro do container: o banco já vem com ele, e assim ninguém precisa instalar o
# cliente na máquina. Como a conexão é interna, porta do host e senha não entram. O `-T` é o que
# deixa passar um arquivo do host pela entrada padrão (`-f - < script`).
psql_banco() {
    docker compose exec -T db psql -q -U "$(env_de POSTGRES_USER)" -d "$(env_de POSTGRES_DB)" \
        -v ON_ERROR_STOP=1 "$@"
}

ocupada() { ss -lnt 2>/dev/null | grep -q ":$1 "; }

# Depois de matar, a porta leva um instante para ser devolvida. Subir antes disso faria o vite
# escolher a 5174 em silêncio — e o esperar na 5173 acharia o processo velho, não o novo.
porta_livre() {  # porta, nome
    local fim=$((SECONDS + 15))

    while ocupada "$1"; do
        if [ "$SECONDS" -ge "$fim" ]; then
            erro "A porta $1 continua ocupada. Veja quem está nela: ss -lptn 'sport = :$1'"
            return 1
        fi
        sleep 1
    done
}

# Devolve 1 em vez de sair: na subida inicial quem sai é o chamador; num reinício, a falha é
# avisada e o terminal continua escutando, senão um "r" que deu errado derrubaria tudo.
esperar() {  # url, nome, log
    local fim=$((SECONDS + ESPERA))

    until curl -sf -o /dev/null "$1"; do
        if [ "$SECONDS" -ge "$fim" ]; then
            erro "$2 não respondeu em ${ESPERA}s. Fim do registro:"
            tail -20 "$3" >&2
            return 1
        fi
        sleep 1
    done
}

# O frontend sobe com setsid, no próprio grupo de processos, e é o grupo inteiro que morre aqui.
# Matar só o processo, ou só os filhos diretos, deixa neto de pé segurando a porta: o pnpm lança
# um sh, que lança o node. Foi assim que um node ficou órfão na 5173 no primeiro teste do "r", e o
# frontend novo subiu na 5174 sem ninguém perceber.
matar() {
    [ -n "$1" ] || return 0
    kill -TERM -- "-$1" 2>/dev/null || true
    wait "$1" 2>/dev/null || true
}

vivo() { [ -n "$1" ] && kill -0 "$1" 2>/dev/null; }

precisa docker "Instale o Docker, ou suba um PostgreSQL você mesmo e siga o README."
precisa pnpm   "Rode 'corepack enable' para ter o pnpm."

[ -f .env ] || { erro "Falta o .env na raiz. Copie o .env.example e preencha usuário, senha e banco."; exit 1; }
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

# Uma porta só para a API, valendo para tudo: o Compose publica nela, este script espera por ela,
# e o frontend a recebe por VITE_API_URL — que o Vite prefere ao .env dele. Ambiente ganha do
# arquivo, como no Compose; sem nenhum dos dois, 5062.
PORTA_API="${API_PORT:-$(env_de API_PORT)}"
PORTA_API="${PORTA_API:-5062}"
export API_PORT="$PORTA_API"
API_URL="http://localhost:$PORTA_API"

# Registro limpo a cada execução: log de ontem misturado com o de agora só atrapalha quem está
# procurando por que alguma coisa não subiu.
mkdir -p "$LOGS"
rm -f "$LOGS"/*.log

# Um container da API esquecido de uma subida anterior é deste script: sai antes de conferir as
# portas, para a 5062 não ser acusada de ocupada por ele mesmo.
docker compose stop api < /dev/null >/dev/null 2>&1 || true

for porta in "$PORTA_API" 5173; do
    ocupada "$porta" && { erro "A porta $porta já está em uso. Derrube o processo que está nela e rode de novo."; exit 1; }
done

API_LOG_PID=""
WEB_PID=""

# O motivo vai na frase porque encerrar sem pedir é a pergunta que fica: foi q, Ctrl+C, ou alguém
# de fora mandou um SIGTERM (outro processo, um kill)? E sai no fim: sem o exit, depois de um sinal
# o bash voltaria ao laço, que acharia a API e o frontend mortos — mortos por este mesmo script —
# e anunciaria "caiu" com tudo já no chão.
encerrar() {  # motivo
    trap - INT TERM EXIT
    echo
    azul "Encerrando (${1:-fim do script})…"
    matar "$WEB_PID"
    parar_api
    docker compose down >/dev/null 2>&1 || true
    echo "Tudo fora do ar. O volume do banco ficou; os dados voltam na próxima subida."
    exit 0
}

trap 'encerrar "Ctrl+C"' INT
trap 'encerrar "SIGTERM recebido de outro processo"' TERM
trap 'encerrar' EXIT

# ── Banco ──────────────────────────────────────────────────────────────
subir_banco() {
    azul "Subindo o banco…"
    docker compose up -d db >/dev/null

    # Os scripts numerados só rodam sozinhos quando o volume nasce vazio, e o healthcheck é por
    # TCP: "healthy" já significa que eles terminaram.
    until [ "$(docker inspect -f '{{.State.Health.Status}}' oficina-db 2>/dev/null)" = "healthy" ]; do
        sleep 1
    done

    # Num volume que já existia, as migrations novas nunca rodaram. 001 a 003 criam o banco e
    # ficam com o compose; da 004 em diante é migration, roda toda vez — e por isso cada uma é
    # escrita para poder rodar de novo sem duplicar nada.
    local script numero
    for script in scripts/*.sql; do
        numero="$(basename "$script" | cut -d_ -f1)"
        [ "$numero" -ge 004 ] 2>/dev/null || continue

        psql_banco -f - < "$script"
    done
}

# ── API ────────────────────────────────────────────────────────────────
# A API sobe como container, pela mesma imagem do `docker compose up`: o --build garante que ela
# reflete o código atual (com cache, é rápido quando nada mudou), e o --force-recreate faz o r
# reiniciar mesmo quando a imagem é a mesma. O log do container vai para .run/api.log, como
# sempre foi, por um `docker compose logs -f` que fica de pé enquanto a API estiver.
subir_api() {
    porta_livre "$PORTA_API" || return 1

    # stdin fechado nos dois, como no frontend: o terminal é do laço de teclas lá embaixo, e um
    # processo em segundo plano que o toca é parado pelo sistema (SIGTTIN) sem avisar ninguém.
    azul "Subindo a API (imagem Docker — a primeira construção demora, as próximas usam cache)…"
    if ! docker compose up -d --build --force-recreate api < /dev/null > "$LOGS/api-build.log" 2>&1; then
        erro "A imagem da API não construiu. Fim de .run/api-build.log:"
        tail -20 "$LOGS/api-build.log" >&2
        return 1
    fi

    setsid docker compose logs -f --no-color --no-log-prefix api < /dev/null > "$LOGS/api.log" 2>&1 &
    API_LOG_PID=$!
    esperar "$API_URL/api/agendamentos?pagina=1&tamanhoDaPagina=1" "A API" "$LOGS/api.log"
}

parar_api() {
    matar "$API_LOG_PID"; API_LOG_PID=""
    docker compose stop api < /dev/null >/dev/null 2>&1 || true
}

api_viva() { [ "$(docker inspect -f '{{.State.Running}}' oficina-api 2>/dev/null)" = "true" ]; }

# ── Frontend ───────────────────────────────────────────────────────────
subir_web() {
    [ -d frontend/node_modules ] || { azul "Instalando as dependências do frontend…"; (cd frontend && pnpm install); }

    porta_livre 5173 || return 1

    # stdin fechado: o vite também escuta teclas (o "r" dele reinicia só o servidor dele), e as
    # teclas deste terminal são do laço lá embaixo.
    azul "Subindo o frontend…"
    VITE_API_URL="$API_URL/api" setsid pnpm --dir frontend dev < /dev/null > "$LOGS/web.log" 2>&1 &
    WEB_PID=$!
    esperar "$WEB_URL" "O frontend" "$LOGS/web.log"
}

# ── Comandos em tempo de execução ──────────────────────────────────────
reiniciar() {
    azul "Reiniciando a API e o frontend…"
    matar "$WEB_PID"; WEB_PID=""
    parar_api
    subir_api && subir_web && no_ar || erro "O reinício não completou. Veja .run/api.log e .run/web.log, e tente r de novo."
}

# Zerar é esvaziar, não recriar: as tabelas, restrições e índices ficam, as linhas vão embora, e
# o seed não volta. Como o esquema não muda, API e frontend continuam de pé — as conexões do pool
# seguem válidas. As três tabelas no mesmo TRUNCATE para as chaves estrangeiras não reclamarem.
zerar_banco() {
    azul "Zerando o banco…"
    psql_banco -c "TRUNCATE agendamentos, veiculos, clientes" \
        && echo "Tabelas vazias. Para voltar o seed: encerre e rode ./run.sh --reset." \
        || erro "Não deu para zerar. O banco está no ar? Veja docker ps."
}

# Onde cada peça roda vai escrito: banco e API em containers, o frontend como processo desta
# máquina, com pid.
no_ar() {
    azul "
No ar:
  Agenda    $WEB_URL
  Swagger   $API_URL/swagger
  Catálogo  $WEB_URL/catalogo

  Banco     container oficina-db (Docker)
  API       container oficina-api (Docker)
  Frontend  vite nesta máquina, pid $WEB_PID

Registro em .run/api.log e .run/web.log.
Teclas:  r  reconstrói e reinicia API e frontend   ·   z  zera o banco (esvazia, sem seed)   ·   q ou Ctrl+C  encerra"
}

# ── Subida ─────────────────────────────────────────────────────────────
if [ "${1:-}" = "--reset" ]; then
    azul "Apagando o volume do banco…"
    docker compose down -v >/dev/null
fi

subir_banco
subir_api || exit 1
subir_web || exit 1
no_ar

# Sem terminal (saída redirecionada, CI), não há tecla para ler: só espera como antes.
[ -t 0 ] || { wait; exit 0; }

# O read com tempo limite serve para duas coisas: escutar a tecla e, entre uma e outra, conferir
# se a API e o frontend ainda estão de pé — um processo que morreu sozinho não avisa ninguém.
while true; do
    if read -rsn1 -t 2 tecla; then
        case "$tecla" in
            r|R) reiniciar ;;
            z|Z) zerar_banco ;;
            q|Q) encerrar "tecla q" ;;
        esac
        continue
    fi

    if ! api_viva || ! vivo "$WEB_PID"; then
        api_viva || erro "A API caiu. Fim de .run/api.log:"
        api_viva || tail -10 "$LOGS/api.log" >&2
        vivo "$WEB_PID" || erro "O frontend caiu. Fim de .run/web.log:"
        vivo "$WEB_PID" || tail -10 "$LOGS/web.log" >&2
        erro "Pressione r para subir de novo, ou q para encerrar."
        # Espera uma tecla sem tempo limite: repetir o aviso a cada dois segundos só faria barulho.
        read -rsn1 tecla || exit 1
        case "$tecla" in
            r|R) reiniciar ;;
            z|Z) zerar_banco ;;
            q|Q) encerrar "tecla q" ;;
        esac
    fi
done
