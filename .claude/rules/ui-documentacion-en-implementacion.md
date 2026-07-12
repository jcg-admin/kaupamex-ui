# UI documentada en implementación — cheat-sheet (canónico en docs)

Regla completa: `docs/.claude/rules/ui-documentacion-en-implementacion.md` — se
carga en sesiones con `docs` en scope. Canon RST:
`source/normativa/estandares/metodologia/documentacion-interfaz-en-implementacion.rst`.
Aquí solo el invariante operativo:

Toda implementación de UI con superficie visible registra su interfaz en el MISMO
pase: (1) `interfaz-<slug>.rst` (mockup ASCII + spec del contrato UI↔API +
estados) **y** (2) un **E2E Playwright con screenshot** (`e2e/<slug>.e2e.js`;
Chromium ya instalado, `npm run e2e`; el `.png` va git-ignored en `e2e/artifacts/`,
el spec sí se versiona). Ambos son parte del DoD de UI — sin ellos la tarea no se
cierra (gate `proc-gestion-backlog` Paso 6: capa 5 = doc de interfaz, capa 7 =
E2E+screenshot). El screenshot curado en docs se nombra `<vista>-<verbo>-<ISO>.png`
(verbo = operación evidenciada get/post/update; ISO por `date -u`, `:`→`-`); las
capturas de error se **preservan** con su fecha (no se sobrescriben) y un
screenshot en estado de error **NO satisface** la capa 7. Adoptar los primitivos
nativos existentes (`Tabs`, `Alert`, `DataTable`, `lib/intl`, …), no reimplementar
a mano. Nunca diferir a una iniciativa futura de "mejora". Precedente:
`interfaz-adminlogspage.rst`.
