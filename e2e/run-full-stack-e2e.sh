#!/usr/bin/env bash
# =============================================================================
# run-full-stack-e2e.sh — runbook de UN comando para el E2E de navegador.
# =============================================================================
# Arranca, EN ORDEN, las tres capas reales y corre Playwright:
#   db (MariaDB socket + migrate + seed) -> api (runserver :8000)
#   -> ui (webpack serve :3001) -> playwright (npm run e2e)
#
# Playwright NO tiene webServer (ver playwright.config.js); este script
# hace la orquestación. Entorno autoritativo (verde oficial): WSL (L-010).
#
# En el CONTENEDOR del agente corre para specs BUYER *localhost-only* (login +
# navegación + screenshot): MariaDB por socket (start_db.sh + DB_SOCKET, ver
# abajo), Node v22 nativo, Chromium en /opt/pw-browsers. Libera :8000/:3001
# antes de arrancar (free_port, H-UI-LOG-07) y resuelve monorepo O clones
# separados (H-UI-LOG-05).
#
#   Specs ADMIN/AUTENTICADOS (p.ej. admin-logs.e2e.js) SÍ producen evidencia
#   válida in-container: same-origin resuelto (ui@ad64776, iniciativa
#   corregir-harness-auth-e2e-same-origin) — el bundle dev usa baseURL relativo
#   y el proxy /api → :8000, así la cookie de sesión viaja misma-origin
#   (:3001→proxy→:8000). El seed y el login del admin comparten defaults (bloque
#   Admin abajo), así que el spec corre BARE, sin exportar credenciales a mano
#   (H-UI-LOG-10: antes el seed usaba ADMIN_EMAIL del .env y el spec caía a
#   testadmin@example.com → 401).
#
#   Specs con EGRESS HTTPS externo (MercadoPago: createCardToken) NO corren
#   directo — el navegador del contenedor no tiene egress; usar el puente
#   e2e/fixtures/mp-bridge.js (E2E_MP_BRIDGE=1 + HTTPS_PROXY) o WSL/CI.
#
# Uso:
#   cd ui && bash e2e/run-full-stack-e2e.sh              # toda la suite
#   E2E_SPEC=smoke.e2e.js bash e2e/run-full-stack-e2e.sh # solo un spec
#   # spec admin autenticado — corre BARE (seed y login alineados por default):
#   E2E_SPEC=admin-logs.e2e.js bash e2e/run-full-stack-e2e.sh
#   # (override opcional: ADMIN_EMAIL=... ADMIN_PASSWORD=... — E2E_ADMIN_* se derivan)
#
# Variables (con defaults):
#   SUPERREPO/API_DIR/DB_DIR/UI_DIR   rutas (monorepo o clones separados)
#   QA_BUYER_EMAIL/QA_BUYER_PASSWORD  creds del comprador de seed (= E2E_*)
#   E2E_ADMIN_EMAIL/E2E_ADMIN_PASS    creds admin (specs autenticados)
#   ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD  seed del admin (is_staff)
#   PW_BASE_URL      default http://localhost:3001 (perfil dev cross-origin)
#   DB_SSL_MODE      DISABLED in-container (socket, H-API-LOG-04); vacío en WSL/TCP
#   DB_SOCKET        /run/mysqld/mysqld.sock in-container; vacío en WSL/TCP
#   E2E_SPEC         spec único a correr (default: todos los *.e2e.js)
#   E2E_MP_BRIDGE    =1 para specs de egress MP (con HTTPS_PROXY)
#
# Gate Node 22 (L-012). Verde autoritativo: WSL (L-010). Limpia api+ui
# (background) al salir vía trap.
# =============================================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UI_DIR="${UI_DIR:-$(cd "$HERE/.." && pwd)}"        # este repo ui (contiene e2e/)
PARENT="$(cd "$UI_DIR/.." && pwd)"
SUPERREPO="${SUPERREPO:-$PARENT}"

# Resuelve api/db en DOS layouts (H-UI-LOG-05): monorepo ($PARENT/api,
# $PARENT/db) o clones separados hermanos ($PARENT/kaupamex-api, o el sufijo
# -ui->-api del propio UI_DIR: /home/user/kaupamex-ui -> .../kaupamex-api).
_resolve_dir() {  # _resolve_dir <role: api|db>
    local role="$1" cand
    for cand in "$PARENT/$role" "$PARENT/e-commerce-$role" "$PARENT/kaupamex-$role" "${UI_DIR%-ui}-$role"; do
        [ -d "$cand" ] && { printf '%s\n' "$cand"; return 0; }
    done
    return 1
}
API_DIR="${API_DIR:-$(_resolve_dir api || true)}"
DB_DIR="${DB_DIR:-$(_resolve_dir db || true)}"
[ -d "${API_DIR:-}" ] && [ -d "${DB_DIR:-}" ] || {
    echo "ERROR: no resolví API_DIR/DB_DIR (ni monorepo ni clones separados)."
    echo "  UI_DIR=$UI_DIR PARENT=$PARENT"
    echo "  Exporta API_DIR/DB_DIR manualmente si tu layout es distinto."
    exit 1
}

QA_BUYER_EMAIL="${QA_BUYER_EMAIL:-buyer@e-commerce.test}"
QA_BUYER_PASSWORD="${QA_BUYER_PASSWORD:-Test1234!}"
export QA_BUYER_EMAIL QA_BUYER_PASSWORD
export PW_BASE_URL="${PW_BASE_URL:-http://localhost:3001}"
# SOL-081 (H-UI-LOG-08): el E2E full-stack debe tocar el BACKEND REAL, no los
# mocks. En dev el mockInterceptor mockea todo /api salvo que PY_API_SOURCE!='mock'
# → lo desactivamos para probar de verdad. Además el bundle dev usa baseURL
# relativo (webpack.config.js) para que las requests viajen misma-origin
# (:3001 → proxy → :8000) y la cookie de sesión viaje; el proxy apunta a :8000
# vía API_PROXY_TARGET (independiente de API_URL).
export PY_API_SOURCE="${PY_API_SOURCE:-db}"
export API_PROXY_TARGET="${API_PROXY_TARGET:-http://localhost:8000}"
export E2E_EMAIL="$QA_BUYER_EMAIL"
export E2E_PASSWORD="$QA_BUYER_PASSWORD"

# Admin (specs autenticados, p.ej. admin-logs.e2e.js): seed y login comparten
# una sola fuente, igual que el buyer arriba. create_seed_users siembra el
# admin con ADMIN_EMAIL/ADMIN_PASSWORD (username=email); el spec loguea con
# E2E_ADMIN_EMAIL/E2E_ADMIN_PASS. Antes NO se alineaban: el seed leía
# ADMIN_EMAIL del .env (admin@practicayoruba.com) mientras el spec caía a su
# default testadmin@example.com/Admin1234! → "POST /auth/login 401" y evidencia
# en estado de error (H-UI-LOG-10). Exportamos ADMIN_* (así create_seed_users
# los toma de os.environ ANTES del fallback a decouple/.env) y derivamos
# E2E_ADMIN_* de ellos: seed y login coinciden en cualquier layout.
ADMIN_EMAIL="${ADMIN_EMAIL:-testadmin@example.com}"
ADMIN_USERNAME="${ADMIN_USERNAME:-testadmin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-Admin1234!}"
export ADMIN_EMAIL ADMIN_USERNAME ADMIN_PASSWORD
export E2E_ADMIN_EMAIL="${E2E_ADMIN_EMAIL:-$ADMIN_EMAIL}"
export E2E_ADMIN_PASS="${E2E_ADMIN_PASS:-$ADMIN_PASSWORD}"

# DB por socket local + TLS apagado para el perfil dev (H-API-LOG-04): el
# MariaDB local/CI tiene cert self-signed; con la verificación por certifi
# (default) la conexión rompe con "certificate verify failed". DB_SSL_MODE=
# DISABLED apaga TLS (paridad con testing.py) y DB_SOCKET usa el socket que
# start_db.sh levanta. En WSL/CI con TCP+SSL real, exporta DB_SSL_MODE="" y
# DB_SOCKET="" para conservar el camino TCP+SSL.
export DB_SSL_MODE="${DB_SSL_MODE:-DISABLED}"
export DB_SOCKET="${DB_SOCKET:-/run/mysqld/mysqld.sock}"

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

free_port() {  # free_port <puerto> — mata cualquier proceso que lo ocupe
    # Sin esto, un runserver/webpack stale de una corrida previa hace que el
    # nuevo falle con "That port is already in use" y la corrida quede sirviendo
    # DESDE EL SERVIDOR STALE (estado no controlado) — la causa raíz de que la
    # evidencia E2E capturara un estado de error (SOL-011 H-UI-LOG-07).
    # Nota: nunca debe retornar != 0 (correría bajo `set -euo pipefail`).
    local port="$1" pids
    if command -v fuser >/dev/null 2>&1; then
        fuser -k "${port}/tcp" 2>/dev/null || true
    else
        pids=$(ss -ltnpH "sport = :${port}" 2>/dev/null \
               | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u) || true
        [ -n "${pids:-}" ] && kill $pids 2>/dev/null || true
    fi
    sleep 1
    return 0
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
free_port 8000   # evita servir desde un runserver stale (H-UI-LOG-07)
( cd "$API_DIR" && \
  DJANGO_SETTINGS_MODULE=config.settings.development \
  uv run python practicayoruba/manage.py runserver 0.0.0.0:8000 ) >"$API_LOG" 2>&1 &
API_PID=$!
wait_http "http://localhost:8000/api/schema/" 60

# ─── 3) UI: webpack serve :3001 ─────────────────────────────────────────────
log "3/4 ui: webpack serve :3001 (log: $UI_LOG)"
free_port 3001   # evita servir desde un webpack stale (H-UI-LOG-07)
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
