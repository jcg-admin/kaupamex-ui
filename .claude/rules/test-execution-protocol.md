# Protocolo de ejecución de pruebas — cheat-sheet (canónico en docs)

Regla completa: `docs/.claude/rules/test-execution-protocol.md`.

> **Corregido 2026-08-07.** Este archivo era una **copia completa obsoleta** (8815 B)
> que declaraba MariaDB, `/run/mysqld/mysqld.sock`, los schemas `practicayoruba_*` y
> **Node v20** — los cuatro superados: el motor es PostgreSQL (ADR-028), las bases son
> `kaupamex_db`/`kaupamex_qa`, y `.nvmrc` fija **22**. Una sesión de `ui` cargaba el
> protocolo equivocado como autoritativo. Ver H-DOCS-97.

Invariante operativo:

**La suite completa NO se corre por defecto** — se corre el subconjunto que el cambio
toca. Los gates estáticos (`npm run check:lazy`, `npm run check:canon`, `stylelint`)
cuestan segundos y **sí** se corren siempre.

**El subconjunto se DERIVA, no se elige de memoria** (directiva del ejecutor
2026-08-27, medida en `api` — ver la regla canónica). Es el módulo tocado **más sus
consumidores medidos**, y el comando va citado junto al resultado:

```bash
grep -rl '<Componente>\|<modulo>' --include='*.js' --include='*.jsx' src/ tests/ \
    | sed 's|/[^/]*$||' | sort | uniq -c
npx jest --testPathPattern="<patrón que cubra esos directorios>"
```

La suite completa queda para tres casos: un cambio en el **store de Redux** o en
`apiService.js` (que toda la app ejerce), **antes de abrir un PR o al cerrar un
bloque**, y cuando el ejecutor la pide.

Gate duro de Node **v22** antes de `npm ci`/`npm test` (L-012): `.nvmrc` fija la
versión pero NO carga nvm; en shell nuevo `node` cae al del sistema.

```bash
export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use && node -v | grep -q '^v22\.' || { echo "Node != v22; PARAR"; exit 1; }
npm ci --ignore-scripts && npm test -- --watchAll=false --ci
```

Baseline jest: 779/780 (1 skip). El verde autoritativo es WSL, no el contenedor (L-010).
El build de docs (`make html`) es **opcional**, no parte del DoD.
