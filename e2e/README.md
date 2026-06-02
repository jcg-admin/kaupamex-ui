# E2E de navegador (Playwright)

Harness E2E full-stack del producto PracticaYoruba. Decisión de
herramienta y rationale: **ADR-FE-004** (Playwright). Alcance y reparto:
iniciativa `implementar-e2e-navegador` en `e-comerce-docs`.

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

```bash
# [deploy] BD viva + QA sembrada (por socket)
sudo bash /srv/repos/ecom/e-comerce-db/scripts/start_db.sh
sudo bash /srv/repos/ecom/e-comerce-api/scripts/provisioners/mysql/db_qa_setup.sh

# [develop] api sirviendo endpoints (:8000)
cd /srv/repos/ecom/e-comerce-api
uv run python practicayoruba/manage.py runserver 0.0.0.0:8000 &

# [develop] ui servida (:3001, dev) — cross-origin contra api
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd /srv/repos/ecom/e-comerce-ui && nvm use && npm run dev &

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
