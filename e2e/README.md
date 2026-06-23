# E2E de navegador (Playwright)

Harness E2E full-stack del producto PracticaYoruba. Decisión de
herramienta y rationale: **ADR-FE-004** (Playwright). Alcance y reparto:
iniciativa `implementar-e2e-navegador` en `e-commerce-docs`.

## Qué prueba

Un flujo smoke que cruza las **tres capas reales** en un navegador:

```
login → catálogo → agregar al carrito → carrito → checkout
```

A diferencia de `jest` (jsdom + mocks), el E2E ejercita la integración
real **db ↔ api ↔ ui**. Es la capa que detecta los bugs de contrato que
las suites aisladas no ven (p. ej. el bug de rutas `/carrito → /404` que
`jest` enmascaraba con una ruta falsa).

> **No reemplaza** `jest` ni `pytest`. Es una capa adicional sobre ellas
> (ver ADR-FE-004 "Alcance de este ADR").

## Entorno autoritativo: WSL (L-010)

El verde **se corre en WSL**, contra la pila levantada por socket. El
contenedor del agente NO es autoritativo. Perfiles: `deploy` (sudo)
levanta/siembra la BD; `develop` corre api/ui/playwright.

## Runbook (orden importa)

### Un comando (recomendado)

`run-full-stack-e2e.sh` orquesta las 4 capas en orden, espera a que cada
una esté lista, siembra el usuario `qabuyer` + catálogo, corre Playwright
y limpia api/ui al salir:

```bash
cd e-commerce-ui
bash e2e/run-full-stack-e2e.sh                 # toda la suite
E2E_SPEC=smoke.e2e.js bash e2e/run-full-stack-e2e.sh   # solo el smoke
```

Variables (defaults sensatos): `QA_BUYER_EMAIL`/`QA_BUYER_PASSWORD` (creds
del comprador de seed, también usadas por Playwright), `PW_BASE_URL`
(default `http://localhost:3001`, perfil dev cross-origin), `SUPERREPO`/
`API_DIR`/`DB_DIR`/`UI_DIR` (rutas de los submódulos). El script aplica el
gate Node 20 (L-012) y arranca MariaDB → `migrate` → `create_seed_users`
→ `create_seed_catalog` → `runserver :8000` → `npm run dev :3001` →
`npm run e2e`.

### Pasos manuales (la versión expandida del script)

```bash
# [deploy] BD viva + QA sembrada (por socket)
sudo bash /opt/practicayoruba/db/scripts/start_db.sh
sudo bash /opt/practicayoruba/api/scripts/provisioners/mysql/db_qa_setup.sh

# [develop] api sirviendo endpoints (:8000)
cd /opt/practicayoruba/api
uv run python practicayoruba/manage.py runserver 0.0.0.0:8000 &

# [develop] ui servida (:3001, dev) — cross-origin contra api
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /opt/practicayoruba/ui && nvm use && npm run dev &

# [develop] instalar Playwright (una vez) + correr el smoke
npm install                 # trae @playwright/test del package.json
npm run e2e:install         # descarga el navegador chromium
E2E_EMAIL='<buyer-sembrado>' E2E_PASSWORD='<password>' npm run e2e
```

`baseURL` por defecto `http://localhost:3001` (dev). Para correr contra
el perfil `deploy` (same-origin via `serve_spa`), exportar
`PW_BASE_URL=http://<host>` antes de `npm run e2e`.

## Convenciones

- **Selectores:** `data-testid` como contrato único (ADR-FE-004). Los
  específicos del smoke: `login-email`, `login-password`, `login-submit`,
  `product-card-link`, `add-to-cart`, `cart-checkout`, `checkout-submit`.
- **Naming de specs:** `*.e2e.js` (evita que `jest` los tome).
- **Auth:** login por formulario; el JWT vive en memoria del módulo
  (`DEC-AUTH-2`), `storageState` no restaura sesión.

## Estado

Smoke **andamiado**, pendiente de la primera corrida verde en WSL
(L-010). Ampliar la matriz de flujos (registro, devoluciones, pagos MSI,
admin) es trabajo posterior.
