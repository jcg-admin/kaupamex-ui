#!/usr/bin/env bash
# =============================================================================
# run-full-stack-e2e.sh — runbook de UN comando para el E2E de navegador.
# =============================================================================
# Arranca, EN ORDEN, las tres capas reales y corre Playwright:
#   db (MariaDB socket + migrate + seed) -> api (runserver :8000)
#   -> ui (webpack serve :3001) -> playwright (npm run e2e)
#
# Playwright NO tiene webServer (ver playwright.config.js); este script
# hace la orquestación. Entorno autoritativo: WSL (L-010). NO correr en
# el contenedor del agente — necesita MariaDB, Node 20 y browsers.
#
# Uso:
#   cd ui && bash e2e/run-full-stack-e2e.sh
#   # solo el smoke:
#   E2E_SPEC=smoke.e2e.js bash e2e/run-full-stack-e2e.sh
#
# Variables (con defaults):
#   SUPERREPO        raíz del monorepo (default: dos niveles arriba de e2e/)
#   API_DIR/DB_DIR/UI_DIR   rutas de los submódulos
#   QA_BUYER_EMAIL/QA_BUYER_PASSWORD  creds del comprador de seed (= E2E_*)
#   PW_BASE_URL      default http://localhost:3001 (perfil dev cross-origin)
#   E2E_SPEC         spec único a correr (default: todos los *.e2e.js)
#
# Limpia api+ui (background) al salir vía trap.
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SUPERREPO="${SUPERREPO:-$(cd "$HERE/../.." && pwd)}"
API_DIR="${API_DIR:-$SUPERREPO/api}"
DB_DIR="${DB_DIR:-$SUPERREPO/db}"
UI_DIR="${UI_DIR:-$SUPERREPO/ui}"

QA_BUYER_EMAIL="${QA_BUYER_EMAIL:-buyer@e-commerce.test}"
QA_BUYER_PASSWORD="${QA_BUYER_PASSWORD:-Test1234!}"
export QA_BUYER_EMAIL QA_BUYER_PASSWORD
export PW_BASE_URL="${PW_BASE_URL:-http://localhost:3001}"
export E2E_EMAIL="$QA_BUYER_EMAIL"
export E2E_PASSWORD="$QA_BUYER_PASSWORD"

API_LOG=/tmp/e2e-api.log
UI_LOG=/tmp/e2e-ui.log
API_PID=""; UI_PID=""

log() { printf '\n\033[1;36m[runbook]\033[0m %s\n' "$*"; }

cleanup() {
    log "teardown: deteniendo api/ui background…"
    [ -n "$UI_PID" ]  && kill "$UI_PID"  2>/dev/null || true
    [ -n "$API_PID" ] && kill "$API_PID" 2>/dev/null || true
}
trap cleanup EXIT

wait_http() {  # wait_http <url> <segundos>
    local url="$1" max="${2:-60}" i=0
    until curl -sf -o /dev/null "$url"; do
        i=$((i+1)); [ "$i" -ge "$max" ] && { echo "TIMEOUT esperando $url"; return 1; }
        sleep 1
    done
}

# ─── Gate Node 22 (L-012): nvm no se auto-carga en shell nuevo ──────────────
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
( cd "$UI_DIR" && nvm use >/dev/null 2>&1 || true )
node -v | grep -q '^v22\.' || { echo "Node != v22 — corre 'nvm use 22'"; exit 1; }

# ─── 1) DB: MariaDB socket + migrate + seed (usuarios + catálogo) ────────────
log "1/4 db: arrancando MariaDB + migrate + seed"
bash "$DB_DIR/scripts/start_db.sh"
( cd "$API_DIR" && \
  uv run python practicayoruba/manage.py migrate --settings=config.settings.development && \
  uv run python practicayoruba/manage.py create_seed_users   --settings=config.settings.development && \
  uv run python practicayoruba/manage.py create_seed_catalog --settings=config.settings.development )

# ─── 2) API: runserver :8000 (perfil develop) ───────────────────────────────
log "2/4 api: runserver :8000 (log: $API_LOG)"
( cd "$API_DIR" && \
  DJANGO_SETTINGS_MODULE=config.settings.development \
  uv run python practicayoruba/manage.py runserver 0.0.0.0:8000 ) >"$API_LOG" 2>&1 &
API_PID=$!
wait_http "http://localhost:8000/api/schema/" 60

# ─── 3) UI: webpack serve :3001 ─────────────────────────────────────────────
log "3/4 ui: webpack serve :3001 (log: $UI_LOG)"
( cd "$UI_DIR" && npm run dev ) >"$UI_LOG" 2>&1 &
UI_PID=$!
wait_http "http://localhost:3001" 90

# ─── 4) Playwright (instala chromium si falta) ──────────────────────────────
log "4/4 playwright: e2e (buyer=$QA_BUYER_EMAIL, baseURL=$PW_BASE_URL)"
cd "$UI_DIR"
npm run e2e:install >/dev/null 2>&1 || true
if [ -n "${E2E_SPEC:-}" ]; then
    npx playwright test "e2e/${E2E_SPEC}"
else
    npm run e2e
fi
RESULT=$?

log "E2E terminó con exit=$RESULT. Reporte: $UI_DIR/playwright-report/index.html"
exit "$RESULT"
