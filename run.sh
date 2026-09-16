#!/usr/bin/env bash
#
# Sobe o sistema inteiro com um comando: banco, API e frontend.
#
#   ./run.sh            banco no ar, API na 5062, frontend na 5173
#   ./run.sh --reset    apaga o volume do banco antes, recriando do zero
#
# Ctrl+C derruba o que este script subiu. O banco fica.

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

ocupada() { ss -lnt 2>/dev/null | grep -q ":$1 "; }

esperar() {  # url, nome, log
    local fim=$((SECONDS + ESPERA))

    until curl -sf -o /dev/null "$1"; do
        if [ "$SECONDS" -ge "$fim" ]; then
            erro "$2 não respondeu em ${ESPERA}s. Fim do registro:"
            tail -20 "$3" >&2
            exit 1
        fi
        sleep 1
    done
}

# Matar só o processo deixaria o filho de pé segurando a porta: o 'dotnet run' lança o Oficina.Api,
# o pnpm lança o node.
matar() {
    [ -n "$1" ] || return 0
    pkill -TERM -P "$1" 2>/dev/null || true
    kill  -TERM    "$1" 2>/dev/null || true
}

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
    wait 2>/dev/null || true
    echo "O banco continua no ar. Para derrubá-lo: docker compose stop db"
}

trap encerrar INT TERM EXIT

# ── Banco ──────────────────────────────────────────────────────────────
if [ "${1:-}" = "--reset" ]; then
    azul "Apagando o volume do banco…"
    docker compose down -v >/dev/null
fi

azul "Subindo o banco…"
docker compose up -d db >/dev/null

# Os scripts numerados só rodam sozinhos quando o volume nasce vazio, e o healthcheck é por TCP:
# "healthy" já significa que eles terminaram.
until [ "$(docker inspect -f '{{.State.Health.Status}}' oficina-db 2>/dev/null)" = "healthy" ]; do
    sleep 1
done

# Num volume que já existia, as migrations novas nunca rodaram. 001 a 003 criam o banco e ficam
# com o compose; da 004 em diante é migration, roda toda vez — e por isso cada uma é escrita para
# poder rodar de novo sem duplicar nada.
for script in scripts/*.sql; do
    numero="$(basename "$script" | cut -d_ -f1)"
    [ "$numero" -ge 004 ] 2>/dev/null || continue

    PGPASSWORD="$(env_de POSTGRES_PASSWORD)" psql -q -h localhost -p "$(env_de DB_PORT || echo 5432)" \
        -U "$(env_de POSTGRES_USER)" -d "$(env_de POSTGRES_DB)" -v ON_ERROR_STOP=1 -f "$script"
done

# ── API ────────────────────────────────────────────────────────────────
azul "Subindo a API…"
dotnet run --project backend/src/Oficina.Api > "$LOGS/api.log" 2>&1 &
API_PID=$!
esperar "$API_URL/api/agendamentos?pagina=1&tamanhoDaPagina=1" "A API" "$LOGS/api.log"

# ── Frontend ───────────────────────────────────────────────────────────
[ -d frontend/node_modules ] || { azul "Instalando as dependências do frontend…"; (cd frontend && pnpm install); }

azul "Subindo o frontend…"
pnpm --dir frontend dev > "$LOGS/web.log" 2>&1 &
WEB_PID=$!
esperar "$WEB_URL" "O frontend" "$LOGS/web.log"

azul "
No ar:
  Agenda    $WEB_URL
  Swagger   $API_URL/swagger
  Catálogo  $WEB_URL/catalogo

Registro em .run/api.log e .run/web.log. Ctrl+C encerra."

wait
