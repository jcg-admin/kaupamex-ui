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
#   ⚠ Specs ADMIN/AUTENTICADOS (p.ej. admin-logs.e2e.js) NO producen evidencia
#     válida in-container: baseURL absoluto (:8000) + credentials:'same-origin'
#     → la cookie de sesión no viaja cross-origin (:3001→:8000) → 403 →
#     "No se pudo cargar el log." (H-UI-LOG-08, ABIERTO; endpoint sano vía DRF).
#     Correrlos en WSL same-origin o esperar el fix
#     (iniciativa corregir-harness-auth-e2e-same-origin).
#
#   Specs con EGRESS HTTPS externo (MercadoPago: createCardToken) NO corren
#   directo — el navegador del contenedor no tiene egress; usar el puente
#   e2e/fixtures/mp-bridge.js (E2E_MP_BRIDGE=1 + HTTPS_PROXY) o WSL/CI.
#
# Uso:
#   cd ui && bash e2e/run-full-stack-e2e.sh              # toda la suite
#   E2E_SPEC=smoke.e2e.js bash e2e/run-full-stack-e2e.sh # solo un spec
#   # spec admin (requiere same-origin — ver H-UI-LOG-08):
#   E2E_ADMIN_EMAIL=... E2E_ADMIN_PASS=... ADMIN_EMAIL=... ADMIN_USERNAME=... \
#     ADMIN_PASSWORD=... E2E_SPEC=admin-logs.e2e.js bash e2e/run-full-stack-e2e.sh
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
# $PARENT/db) o clones separados hermanos ($PARENT/e-commerce-api, o el sufijo
# -ui->-api del propio UI_DIR: /home/user/e-commerce-ui -> .../e-commerce-api).
_resolve_dir() {  # _resolve_dir <role: api|db>
    local role="$1" cand
    for cand in "$PARENT/$role" "$PARENT/e-commerce-$role" "$PARENT/e-comerce-$role" "${UI_DIR%-ui}-$role"; do
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
# NOTA (SOL-011 H-UI-LOG-08, ABIERTO): en este harness las requests
# autenticadas del navegador NO llegan al runserver :8000 (el api-log solo
# registra el probe /api/schema/). Causa bajo investigación: el DEFINE de
# webpack (webpack.config.js:55) fuerza apiService.baseURL a un absoluto en
# dev, y apiService usa credentials:'same-origin', por lo que la cookie de
# sesión no viaja cross-origin (:3001 → :8000). NO fijar aquí API_URL a
# http://localhost:3001: eso también apunta el devServer.proxy (misma var,
# webpack.config.js:271) a :3001 y crea un self-loop. Fix pendiente de
# decisión del ejecutor (toca el build dev / apiService, alcance > logs).
export E2E_EMAIL="$QA_BUYER_EMAIL"
export E2E_PASSWORD="$QA_BUYER_PASSWORD"

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
