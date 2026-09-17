#!/usr/bin/env bash
#
# Sobe o sistema inteiro com um comando: banco, API e frontend.
#
#   ./run.sh            banco no ar, API na 5062, frontend na 5173
#   ./run.sh --reset    apaga o volume do banco antes, recriando do zero
#
# Com tudo no ar, o terminal fica escutando teclas:
#
#   r        reinicia a API e o frontend
#   z        zera o banco: esvazia as três tabelas, sem seed. O esquema fica
#   q        encerra (o mesmo que Ctrl+C)
#
# Ctrl+C derruba tudo o que este script subiu, banco incluído. O volume fica: os dados
# continuam lá na próxima subida. Para recriar o banco com o seed, --reset.

set -euo pipefail

cd "$(dirname "$0")"

LOGS="$PWD/.run"
API_URL="http://localhost:5062"
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

psql_banco() {
    PGPASSWORD="$(env_de POSTGRES_PASSWORD)" psql -q -h localhost -p "$(env_de DB_PORT || echo 5432)" \
        -U "$(env_de POSTGRES_USER)" -d "$(env_de POSTGRES_DB)" -v ON_ERROR_STOP=1 "$@"
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

# Cada serviço sobe com setsid, no próprio grupo de processos, e é o grupo inteiro que morre aqui.
# Matar só o processo, ou só os filhos diretos, deixa neto de pé segurando a porta: o pnpm lança
# um sh, que lança o node; o 'dotnet run' lança o Oficina.Api. Foi assim que um node ficou órfão
# na 5173 no primeiro teste do "r", e o frontend novo subiu na 5174 sem ninguém perceber.
matar() {
    [ -n "$1" ] || return 0
    kill -TERM -- "-$1" 2>/dev/null || true
    wait "$1" 2>/dev/null || true
}

vivo() { [ -n "$1" ] && kill -0 "$1" 2>/dev/null; }

precisa docker "Instale o Docker, ou suba um PostgreSQL você mesmo e siga o README."
precisa dotnet "Instale o SDK do .NET 10."
precisa pnpm   "Rode 'corepack enable' para ter o pnpm."
precisa psql   "Instale o cliente do PostgreSQL (postgresql-client)."

[ -f .env ] || { erro "Falta o .env na raiz. Copie o .env.example e preencha usuário, senha e banco."; exit 1; }
[ -f frontend/.env ] || cp frontend/.env.example frontend/.env

# Registro limpo a cada execução: log de ontem misturado com o de agora só atrapalha quem está
# procurando por que alguma coisa não subiu.
mkdir -p "$LOGS"
rm -f "$LOGS"/*.log

for porta in 5062 5173; do
    ocupada "$porta" && { erro "A porta $porta já está em uso. Derrube o processo que está nela e rode de novo."; exit 1; }
done

API_PID=""
WEB_PID=""

encerrar() {
    trap - INT TERM EXIT
    echo
    azul "Encerrando…"
    matar "$WEB_PID"
    matar "$API_PID"
    docker compose down >/dev/null 2>&1 || true
    echo "Tudo fora do ar. O volume do banco ficou; os dados voltam na próxima subida."
}

trap encerrar INT TERM EXIT

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

        psql_banco -f "$script"
    done
}

# ── API ────────────────────────────────────────────────────────────────
subir_api() {
    porta_livre 5062 || return 1

    azul "Subindo a API…"
    setsid dotnet run --project backend/src/Oficina.Api < /dev/null > "$LOGS/api.log" 2>&1 &
    API_PID=$!
    esperar "$API_URL/api/agendamentos?pagina=1&tamanhoDaPagina=1" "A API" "$LOGS/api.log"
}

# ── Frontend ───────────────────────────────────────────────────────────
subir_web() {
    [ -d frontend/node_modules ] || { azul "Instalando as dependências do frontend…"; (cd frontend && pnpm install); }

    porta_livre 5173 || return 1

    # stdin fechado: o vite também escuta teclas (o "r" dele reinicia só o servidor dele), e as
    # teclas deste terminal são do laço lá embaixo.
    azul "Subindo o frontend…"
    setsid pnpm --dir frontend dev < /dev/null > "$LOGS/web.log" 2>&1 &
    WEB_PID=$!
    esperar "$WEB_URL" "O frontend" "$LOGS/web.log"
}

# ── Comandos em tempo de execução ──────────────────────────────────────
reiniciar() {
    azul "Reiniciando a API e o frontend…"
    matar "$WEB_PID"; WEB_PID=""
    matar "$API_PID"; API_PID=""
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

no_ar() {
    azul "
No ar:
  Agenda    $WEB_URL
  Swagger   $API_URL/swagger
  Catálogo  $WEB_URL/catalogo

Registro em .run/api.log e .run/web.log.
Teclas:  r  reinicia API e frontend   ·   z  zera o banco (esvazia, sem seed)   ·   q ou Ctrl+C  encerra"
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
            q|Q) exit 0 ;;
        esac
        continue
    fi

    if ! vivo "$API_PID" || ! vivo "$WEB_PID"; then
        vivo "$API_PID" || erro "A API caiu. Fim de .run/api.log:"
        vivo "$API_PID" || tail -10 "$LOGS/api.log" >&2
        vivo "$WEB_PID" || erro "O frontend caiu. Fim de .run/web.log:"
        vivo "$WEB_PID" || tail -10 "$LOGS/web.log" >&2
        erro "Pressione r para subir de novo, ou q para encerrar."
        # Espera uma tecla sem tempo limite: repetir o aviso a cada dois segundos só faria barulho.
        read -rsn1 tecla || exit 1
        case "$tecla" in
            r|R) reiniciar ;;
            z|Z) zerar_banco ;;
            q|Q) exit 0 ;;
        esac
    fi
done
