# E2E de navegador (Playwright)

Harness E2E full-stack del producto PracticaYoruba. Decisión de
herramienta y rationale: **ADR-FE-004** (Playwright). Alcance y reparto:
iniciativa `implementar-e2e-navegador` en `kaupamex-docs`.

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
cd kaupamex-ui
bash e2e/run-full-stack-e2e.sh                          # toda la suite
E2E_SPEC=smoke.e2e.js bash e2e/run-full-stack-e2e.sh    # solo un spec
```

El script aplica el gate **Node 22** (L-012), **libera `:8000`/`:3001`**
antes de arrancar (evita servir desde un servidor stale — H-UI-LOG-07) y
arranca MariaDB → `migrate` → `create_seed_users` → `create_seed_catalog`
→ `runserver :8000` → `npm run dev :3001` → `npm run e2e`. Resuelve tanto
el **monorepo** (`$PARENT/{api,db}`) como **clones separados hermanos**
(`${UI_DIR%-ui}-{api,db}`, p.ej. `/home/user/kaupamex-{api,db,ui}`) —
H-UI-LOG-05.

**Matriz de variables por tipo de spec:**

| Tipo de spec | Variables a exportar | Notas |
|---|---|---|
| Buyer (smoke, catálogo, checkout) | `QA_BUYER_EMAIL`/`QA_BUYER_PASSWORD` (= `E2E_EMAIL`/`E2E_PASSWORD`) | defaults sembrados por `create_seed_users` |
| **Admin/autenticado** (p.ej. `admin-logs.e2e.js`) | `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASS` **+** `ADMIN_EMAIL`/`ADMIN_USERNAME`/`ADMIN_PASSWORD` (seed) | ver caveat H-UI-LOG-08 abajo |
| MP egress (createCardToken) | `E2E_MP_BRIDGE=1` + `HTTPS_PROXY` | usa `e2e/fixtures/mp-bridge.js`; no egress directo in-container |
| Comunes | `PW_BASE_URL` (default `http://localhost:3001`), `SUPERREPO`/`API_DIR`/`DB_DIR`/`UI_DIR` | `PW_BASE_URL` = perfil dev cross-origin |

**En el contenedor del agente** (MariaDB por socket) exportar además:

```bash
export DB_SSL_MODE=DISABLED DB_SOCKET=/run/mysqld/mysqld.sock   # H-API-LOG-04
```

En WSL/CI con TCP+SSL real, dejar ambas vacías. El **verde autoritativo se
sella en WSL** (L-010); el contenedor sirve para verificación rápida de
specs *localhost-only*.

> ⚠ **Caveat — specs admin/autenticados fallan hoy in-container (H-UI-LOG-08).**
> El bundle dev usa un `baseURL` absoluto (`:8000`) mientras corre en `:3001`
> y `apiService` usa `credentials:'same-origin'` → la cookie de sesión no
> viaja cross-origin → las requests autenticadas dan 403 y la vista muestra su
> estado de error (p.ej. `admin-logs` → "No se pudo cargar el log."). El
> endpoint es sano (HTTP 200 vía DRF). Fix propuesto: iniciativa
> `corregir-harness-auth-e2e-same-origin` (Opción A: same-origin vía proxy).
> Hasta cerrarlo, los specs **buyer** sí producen evidencia válida
> in-container; los **admin** solo en un entorno same-origin (WSL con
> `serve_spa`, o tras el fix).

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

Suite en uso (16+ specs: smoke, auth, catálogo, pagos, logistics, admin…).
El verde **autoritativo** se sella en WSL (L-010). En el contenedor corren
los specs **buyer/localhost-only**; los **admin/autenticados** están
bloqueados por **H-UI-LOG-08** (ver caveat arriba) hasta cerrar la
iniciativa `corregir-harness-auth-e2e-same-origin`.
