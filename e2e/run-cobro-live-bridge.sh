#!/usr/bin/env bash
# Runner — cobro real MP sandbox EN EL CONTENEDOR vía el puente de egress.
#
# El contenedor del agente NO tiene egress HTTPS de navegador, pero Node SÍ
# alcanza MP por el proxy sancionado (HTTPS_PROXY). El fixture ui/e2e/fixtures/
# mp-bridge.js relaya *.mercadopago.com por Node → MP.js real tokeniza en un
# navegador real. Este runner levanta DB + api :8000, siembra lo mínimo y
# corre el spec de cobro con el puente activo.
#
# DOS modos:
#   (1) Sin credenciales de comprador → corre SOLO la guarda del puente
#       (payments-mp-bridge.e2e.js): prueba egress + tokenización. Siempre verde.
#   (2) Con credenciales → corre además el cobro end-to-end
#       (payments-cobro-live.e2e.js): login + carrito + checkout + cobro.
#
# La cuenta de comprador es responsabilidad del operador (la cuenta canónica
# `qabuyer` con buzón real queda PENDIENTE de creación). NO se hornea ninguna
# dirección: se pasa por entorno.
#
#   export E2E_BUYER_USERNAME=<username en DB>     # p.ej. qabuyer
#   export QA_BUYER_PASSWORD=<password>            # de practicayoruba/.env
#   export E2E_PAYER_EMAIL=<email disponible>      # buzón real que controlemos
#   export E2E_PRODUCT_ID=<id publicado con stock> # p.ej. el seed QA
#   bash e2e/run-cobro-live-bridge.sh
#
# NUNCA imprime claves: MP_TEST_PUBLIC_KEY se toma de practicayoruba/.env y solo
# se exporta al proceso de Playwright.
set -uo pipefail

UI_DIR="/home/user/e-commerce-ui"
API_DIR="/home/user/e-commerce-api"
DB_START="/home/user/e-commerce-db/scripts/start_db.sh"
ENV_FILE="$API_DIR/practicayoruba/.env"
API_HOST="127.0.0.1"; API_PORT="8000"
LOG_DIR="/tmp"; DJANGO_LOG="$LOG_DIR/mp-bridge-django.log"

say() { printf '\n=== %s ===\n' "$*"; }

# 1) DB por socket (idempotente).
say "DB"
bash "$DB_START" || { echo "start_db.sh falló"; exit 1; }

# 2) Public key sandbox (sin imprimirla).
export MP_TEST_PUBLIC_KEY="$(grep -E '^MP_TEST_PUBLIC_KEY=' "$ENV_FILE" | cut -d= -f2-)"
[ -n "${MP_TEST_PUBLIC_KEY:-}" ] || { echo "MP_TEST_PUBLIC_KEY ausente en $ENV_FILE"; exit 1; }
echo "MP public key: present (len=${#MP_TEST_PUBLIC_KEY})"

# 3) Seeds mínimos (catálogo + gateway sandbox). NO se siembra qabuyer:
#    la cuenta de comprador la aporta el operador (ver cabecera).
say "seeds (catálogo + gateway)"
RUN_DJ=( uv run --project "$API_DIR" python "$API_DIR/practicayoruba/manage.py" )
DJANGO_SETTINGS_MODULE=config.settings.testing PYTHONPATH="$API_DIR/practicayoruba" \
  "${RUN_DJ[@]}" create_seed_catalog 2>&1 | tail -3 || true
DJANGO_SETTINGS_MODULE=config.settings.testing PYTHONPATH="$API_DIR/practicayoruba" \
  "${RUN_DJ[@]}" setup_mp_gateway 2>&1 | tail -3 || true

# 4) ¿Hay credenciales de comprador para el cobro end-to-end?
FULL=0
if [ -n "${E2E_BUYER_USERNAME:-}" ] && [ -n "${QA_BUYER_PASSWORD:-}" ] \
   && [ -n "${E2E_PRODUCT_ID:-}" ]; then
  FULL=1
fi

if [ "$FULL" = "1" ]; then
  say "Django dev :$API_PORT (testing) para el cobro end-to-end"
  DJANGO_SETTINGS_MODULE=config.settings.testing PYTHONPATH="$API_DIR/practicayoruba" \
    nohup uv run --project "$API_DIR" python "$API_DIR/practicayoruba/manage.py" \
    runserver "$API_HOST:$API_PORT" --noreload >"$DJANGO_LOG" 2>&1 &
  DJ_PID=$!; disown "$DJ_PID"
  # Esperar readiness (máx ~20s).
  for _ in $(seq 1 20); do
    curl -s -o /dev/null "http://$API_HOST:$API_PORT/api/v2/payments/public-key/" && break
    sleep 1
  done
fi

# 5) Playwright con el puente activo.
cd "$UI_DIR"
export E2E_MP_BRIDGE=1
export E2E_API_BASE="http://$API_HOST:$API_PORT"

if [ "$FULL" = "1" ]; then
  say "cobro end-to-end (puente + backend)"
  E2E_MP_LIVE=1 npx playwright test \
    e2e/payments-mp-bridge.e2e.js e2e/payments-cobro-live.e2e.js \
    --project=chromium --reporter=list
  RC=$?
  [ -n "${DJ_PID:-}" ] && kill "$DJ_PID" 2>/dev/null
  exit $RC
else
  say "solo guarda del puente (sin credenciales de comprador)"
  echo "Para el cobro end-to-end exporta E2E_BUYER_USERNAME + QA_BUYER_PASSWORD"
  echo "+ E2E_PAYER_EMAIL (email disponible) + E2E_PRODUCT_ID y re-ejecuta."
  npx playwright test e2e/payments-mp-bridge.e2e.js --project=chromium --reporter=list
  exit $?
fi
