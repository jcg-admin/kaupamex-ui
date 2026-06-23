# CLAUDE.md — e-commerce-ui

Submódulo `ui` del monorepo PracticaYoruba (repo GitHub `jcg-admin/e-commerce-ui`).
Frontend "PracticaYoruba UI": e-commerce de productos Yoruba en React 19 + Webpack 5.

## Gobernanza

Esta es una cheat-sheet local — NO redefine la gobernanza. La gobernanza vive en el
superproyecto y aplica también aquí:

- `../e-commerce/.claude/CLAUDE.md` — contexto/flujo del proyecto (Level 2).
- `../e-commerce/.claude/rules/` — reglas no negociables, entre ellas:
  - `commit-conventions.md` — commits estilo Tim Pope (subject imperativo ≤50 ch, sin punto).
  - `timestamps-iso8601-obligatorios.md` — `date -u +"%Y-%m-%dT%H:%M:%S"`, nunca a mano.
  - `react-verification-gate.md` — toda afirmación de estado deriva de una Observation real.
  - `no-lazy-imports.md` — aplica también a `ui/` (`import`/`require` a top-level; excepción: `React.lazy` para code splitting).
  - `test-execution-protocol.md` — gate de Node v20 antes de jest (ver Comandos).

## Stack (verificado en package.json)

- React `^19.0.0` + react-dom `^19.0.0` + react-redux `^9.0.0`
- @reduxjs/toolkit `^2.0.0` · reselect `^4.1.0`
- @tanstack/react-query `^5.100.5` · react-router-dom `^6.20.0`
- Webpack `^5.88.0` + webpack-cli `^5.1.0` + webpack-dev-server `^5.2.3`
- Jest `^29.7.0` + @testing-library/react `^16.3.2` (+ jest-dom, user-event)
- @playwright/test `^1.49.0` (E2E)
- sass `^1.99.0` + sass-loader `^16.0.7` · framer-motion `^12.38.0` · recharts `^2.15.0` · dompurify `^3.4.1`
- engines: node `>=20.0.0`, npm `>=10.0.0` · package version `1.0.0`

## Comandos (scripts de package.json)

GATE DURO de Node ANTES de `npm ci` / `npm test` (L-012). `.nvmrc` fija `20`,
pero NO lo carga; en shell nuevo `node` cae al del sistema:

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use                                # lee .nvmrc (=20)
node -v | grep -q '^v20\.' || { echo "Node != v20; PARAR"; exit 1; }
npm ci --ignore-scripts                # --ignore-scripts evita husky en CI
```

| Tarea | Script |
|---|---|
| Dev server | `npm run dev` (`webpack serve --mode development`) |
| Build prod | `npm run build` (`webpack --mode production`) |
| Build + analyze | `npm run build:analyze` |
| Tests | `npm test` (`jest`) · `npm run test:watch` · `npm run test:coverage` |
| Lint JS | `npm run lint` (`eslint src --ext .js,.jsx,.ts,.tsx`) |
| Lint SCSS | `npm run lint:style` (`stylelint "src/**/*.scss"`) |
| Type-check | `npm run type-check` (`tsc --noEmit`) |
| No-lazy guard | `npm run check:lazy` (`scripts/check-no-lazy-imports.mjs`) |
| Canon idioma | `npm run check:canon` (`scripts/check-canon-idioma.mjs`) |
| E2E (Playwright) | `npm run e2e` (`playwright test`) · `npm run e2e:install` (chromium) |

## Convenciones locales / gotchas

- **Node v22 ≠ v20:** este contenedor tiene `node -v` = `v22.22.2`; `.nvmrc` = `20`.
  Cargar nvm y `nvm use` antes de instalar/test, o el gate jest mide la toolchain equivocada.
- **devServer proxy:** webpack `:3001` proxea `/api` → `process.env.API_URL || http://localhost:8000` (`webpack.config.js:264-273`).
- **JWT en memoria de módulo:** tokens de auth en memory del módulo, NO localStorage/sessionStorage por XSS (DEC-AUTH-2, `src/services/apiService.js:55-60`); reload pierde sesión. Igual para `X-Cart-Token` (DEC-BC-07).
- **Playwright baseURL:** `PW_BASE_URL || http://localhost:3001`; testMatch `**/*.e2e.js` (no colisiona con jest). El verde autoritativo es WSL, no el contenedor (L-010).

## Estructura (verificada con ls)

- `src/` — código fuente (`pages/`, `components/`, `redux/` store, `services/`, `router/`, `hooks/`, `styles/`)
- `src/services/` — `apiService.js`, `secureStorage.js`, `createResilientService.js`
- `e2e/` — specs Playwright (`*.e2e.js`) + `run-full-stack-e2e.sh`
- `scripts/` — checkers (`check-no-lazy-imports.mjs`, `check-canon-idioma.mjs`, `check-scss.mjs`)
- `tests/`, `__mocks__/`, `public/`, `docs/`
