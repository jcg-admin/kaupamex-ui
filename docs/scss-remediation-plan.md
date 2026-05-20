# Plan de remediación SCSS

Plan operativo derivado de [scss-audit.md](scss-audit.md). Organizado
en **6 fases** con **tareas atómicas**: cada tarea cabe en un commit
y tiene criterios de aceptación verificables.

## Convención del plan

Cada tarea tiene:

- **ID** estable (`TASK-X.Y`) para referenciar desde commits/PRs.
- **Tipo**: `cleanup` (borra), `refactor` (sustituye), `decision`
  (requiere acuerdo humano), `structural` (mueve código),
  `enforcement` (añade guarda).
- **Esfuerzo**: `XS` (<30 min), `S` (1-2 h), `M` (medio día),
  `L` (día entero).
- **Acción**: pasos concretos.
- **Aceptación**: cómo verificar que está hecho.
- **Depende de**: tareas previas requeridas.

Convención de commits: el subject incluye el ID de tarea, p. ej.
`Drop duplicate keyframes spin in catalog pages (TASK-1.1)`.

## Resumen de fases

| Fase | Tema                                | Riesgo | Bloquea a |
|------|-------------------------------------|--------|-----------|
| 1    | Quick wins (cero decisiones)        | Bajo   | —         |
| 2    | Decisiones de catálogo              | —      | 3, 4      |
| 3    | Migración de tokens drop-in         | Bajo   | 6         |
| 4    | Migración de tokens con nuevo color | Medio  | 6         |
| 5    | Refactor estructural                | Bajo   | 6         |
| 6    | Endurecer la guarda                 | Bajo   | —         |

Las fases 1, 2 y 5 son paralelizables. La 3 puede arrancar en
paralelo a la 1. La 4 espera a que la 2 fije los tokens nuevos.
La 6 es el último paso, tras tener inventario controlado.

---

## Fase 1 — Quick wins

Cambios mecánicos sin decisión de diseño. Cada uno reduce deuda
con riesgo casi nulo.

### TASK-1.1 — Borrar `@keyframes spin` duplicado · **BLOQUEADA**

- **Tipo:** cleanup
- **Esfuerzo:** XS originalmente; en realidad requiere cambio de
  toolchain.
- **Estado:** investigada y revertida. Las 9 definiciones locales
  se mantienen.
- **Por qué no se puede borrar directamente:** `css-loader` con
  CSS Modules localiza por defecto los identificadores en
  `animation-name`, incluido el shorthand `animation: spin ...`.
  Cuando eliminamos el `@keyframes spin` local, la referencia
  sigue renombrándose a un hash (ej. `KATGDmHQfZgTK204bHDx`) que
  ya no apunta a nada — los spinners aparecen estáticos en build.
  El `@keyframes spin` global de `_animations.scss:49` existe en
  `main.css`, pero `css-loader` no enlaza referencias locales con
  keyframes globales.
- **Sintaxis intentadas que no funcionan:**
  - `animation: :global(spin) 0.8s ...` → SASS rechaza
    `Expected expression` ante el `:`.
  - `animation-name: :global(spin);` (shorthand partido) → SASS
    rechaza igual.
  - `animation: #{':global(spin)'} ...` (interpolación SCSS) →
    SASS compila, pero postcss-loader falla con `Double colon`.
- **Caminos posibles para retomar:**
  1. **Configurar `css-loader`** con `modules.mode` por archivo
     o `modules.exportLocalsConvention` para no localizar
     `animation-name`. Impacto global, requiere validación
     exhaustiva.
  2. **Mover los `.spinner`** de cada módulo a una clase global
     compartida en `src/styles/components/_spinner.scss`. Los
     módulos referencian la clase por nombre o por `composes`.
  3. **Renombrar el `@keyframes` global** a algo único
     (`y-spin`) y aceptar que cada módulo siga teniendo su copia
     local hasta resolver (1) o (2). Equivale a aceptar el
     status quo.
- **Recomendación:** mover esta tarea a una fase aparte de
  refactor de spinners (camino 2) o tratarla como deuda aceptada
  (~50 bytes gzip por chunk) y reorientar el esfuerzo a las
  tareas con mejor retorno.
- **Depende de:** decisión arquitectónica.

### TASK-1.2 — Unificar imports a `@styles/abstracts`

- **Tipo:** refactor
- **Esfuerzo:** S
- **Acción:** sustituir en los 28 archivos que usan paths
  relativos o split (`abstracts/variables` + `abstracts/mixins`):
  ```scss
  @use '@styles/abstracts' as *;
  ```
- **Archivos afectados:** los 28 que aparecen en
  `grep -rln "@use.*\\.\\./.*abstracts\\|@use.*abstracts/variables\\|@use.*abstracts/mixins" src/`
- **Aceptación:**
  `grep -rh "@use.*abstracts" src/pages src/components src/layouts --include='*.scss' | sort -u`
  devuelve únicamente `@use '@styles/abstracts' as *;`.
  Build y stylelint en verde.
- **Depende de:** —

### TASK-1.3 — Sustituir media queries crudas por mixin

- **Tipo:** refactor
- **Esfuerzo:** XS
- **Acción:** en los 4 archivos identificados, reemplazar
  `@media (max-width: 768px)` por `@include media-down-md`.
- **Archivos:**
  - `src/pages/catalog/CatalogPage.module.scss:110`
  - `src/pages/catalog/ProductPage.module.scss:64`
  - `src/pages/catalog/SearchResultsPage.module.scss:14`
  - `src/pages/cart/CartPage.module.scss:22`
- **Aceptación:**
  `grep -rn "@media (max-width:" src/pages src/components --include='*.module.scss'`
  no devuelve nada. CSS generado equivalente al anterior.
- **Depende de:** —

---

## Fase 2 — Decisiones de catálogo

Bloquean la migración de tokens y mixins. Necesitan input del
equipo (diseño/owner del sistema) antes de ejecutarse.

### TASK-2.1 — Resolver mixins semánticos huérfanos

- **Tipo:** decision + cleanup
- **Esfuerzo:** S (decisión) + M (ejecución)
- **Contexto:** 5 mixins en `_mixins.scss` no se usan en ningún
  módulo: `page-header` (L448), `loading-state` (L459),
  `empty-state` (L468), `error-banner` (L478), `success-banner` (L492).
- **Acción:**
  1. Inventariar dónde cada página implementa "loading", "empty",
     "error banner", "success banner" a mano.
  2. Decidir: **(A)** borrar los mixins (deuda muerta) o
     **(B)** migrar todas esas páginas a usarlos.
  3. Ejecutar la decisión.
- **Aceptación:** o los mixins desaparecen, o `grep` muestra ≥3
  módulos usando cada uno.
- **Depende de:** —

### TASK-2.2 — Aprobar nuevos tokens de color

- **Tipo:** decision
- **Esfuerzo:** S (reunión + commit)
- **Contexto:** estos hex aparecen muchas veces y **no tienen
  token equivalente exacto**. Hay que decidir si entran a la
  paleta o si todas sus apariciones se redirigen al token más
  cercano.

  | Hex       | Frecuencia | Candidato                |
  |-----------|------------|--------------------------|
  | `#b00020` | 59         | `$danger-strong` (nuevo) o `$error-color` |
  | `#1f7a4d` | 30         | `$success-strong` (nuevo) o `$success-color` |
  | `#a32018` | 12         | `$danger-deep` (nuevo) o `$accent-dark` |
  | `#2c2418` | 13         | `$text-strong` (nuevo) o `$text-primary` |
  | `#6b5f50` | 16         | `$text-soft` (nuevo) o `$text-secondary` |
  | `#fdecea` | 12         | `$danger-bg` (nuevo) o `$error-bg` |
  | `#1f3a8a` | 9          | `$info-strong` (nuevo) o `$info-color` |

- **Acción:** decidir caso por caso. Si se acepta un token nuevo,
  añadirlo en la sección 1-3 de `_variables.scss` (no en la de
  aliases, esta es paleta real). Documentar la decisión en el
  commit.
- **Aceptación:** cada hex de la tabla tiene asignado un token
  destino documentado.
- **Depende de:** —

### TASK-2.3 — Promover `%btn` y `%badge` a mixins

- **Tipo:** structural
- **Esfuerzo:** S
- **Acción:**
  1. Definir en `src/styles/abstracts/_mixins.scss` dos mixins
     nuevos: `@mixin btn-state-variant($bg, $color: #fff)` y
     `@mixin badge-state-variant($bg, $color)`, capturando la
     estructura común que ya se repite ad-hoc.
  2. Eliminar las 4 redefiniciones locales:
     - `src/components/returns/AdminReturnReviewPanel.module.scss:38`
     - `src/pages/admin/AdminReturnDetailPage.module.scss:60`
     - `src/pages/account/ReturnsPage.module.scss:73`
     - `src/pages/account/SupportTicketDetailPage.module.scss:34`
- **Aceptación:** `grep -rn "^%btn\|^%badge" src/pages src/components`
  no devuelve nada. Visual sin regresión.
- **Depende de:** —

---

## Fase 3 — Migración de tokens drop-in

Hex con **token exacto equivalente ya existente**. Cero decisión,
cero riesgo visual. Pueden hacerse en lote con `sed`/find-and-replace
verificado.

### TASK-3.1 — Migrar `#fff` → `$bg-surface`

- **Tipo:** refactor
- **Esfuerzo:** M
- **Contexto:** 102 ocurrencias. `$bg-surface` ya es `#FFFFFF`.
  El alias `$white` también está disponible si la semántica encaja.
- **Acción:** find-and-replace en `src/pages` y `src/components`
  (limitado a `*.module.scss`), revisar diffs y commitear.
  Cuidado: NO tocar `rgba(255, 255, 255, ...)` ni `#ffffff`
  dentro de strings (background-image gradients).
- **Aceptación:** `grep -rln '#fff\b' src/pages src/components --include='*.module.scss'`
  baja de 102 a 0 (o un baseline justificado). Build verde, screenshots
  de páginas afectadas sin diff visual.
- **Depende de:** TASK-1.2 (recomendado para evitar conflictos de merge)

### TASK-3.2 — Migrar `#b8860b` → `$primary-color`

- **Tipo:** refactor
- **Esfuerzo:** XS
- **Contexto:** 22 ocurrencias. Es **literalmente el valor de
  `$primary-color`** copiado a mano.
- **Acción:** sustitución directa en los archivos afectados.
- **Aceptación:** 0 ocurrencias de `#b8860b` (case-insensitive)
  fuera de `_variables.scss`.
- **Depende de:** —

### TASK-3.3 — Migrar `#e8e0d5` → `$border-color`

- **Tipo:** refactor
- **Esfuerzo:** XS
- **Contexto:** 9 ocurrencias, valor idéntico a `$border-color`.
- **Acción:** sustitución directa.
- **Aceptación:** 0 ocurrencias de `#e8e0d5` fuera de `_variables.scss`.
- **Depende de:** —

### TASK-3.4 — Inventario de matches exactos restantes

- **Tipo:** discovery + refactor
- **Esfuerzo:** S
- **Acción:** correr un script de comparación entre todos los hex
  de los módulos y los valores literales de los tokens en
  `_variables.scss`. Cualquier match exacto adicional (después
  de 3.1-3.3) entra a esta tarea como sustitución directa.
- **Aceptación:** documento con la lista de matches restantes;
  todos sustituidos o justificados.
- **Depende de:** TASK-3.1, 3.2, 3.3

---

## Fase 4 — Migración con token nuevo

Solo arranca cuando **TASK-2.2** haya decidido qué tokens entran
a la paleta.

### TASK-4.1 — Familia danger (rojo)

- **Tipo:** refactor
- **Esfuerzo:** M
- **Acción:** sustituir `#b00020` (59×), `#a32018` (12×),
  `#fdecea` (12×) por el token decidido en 2.2.
- **Aceptación:** 0 ocurrencias de esos hex en módulos. Stylelint
  + build verdes. Revisar visualmente páginas críticas
  (Returns, Support, formularios con error).
- **Depende de:** TASK-2.2

### TASK-4.2 — Familia success (verde)

- **Tipo:** refactor
- **Esfuerzo:** S
- **Acción:** sustituir `#1f7a4d` (30×) y otros greens duplicados
  por el token decidido.
- **Aceptación:** 0 ocurrencias del hex en módulos.
- **Depende de:** TASK-2.2

### TASK-4.3 — Familia texto y neutros

- **Tipo:** refactor
- **Esfuerzo:** M
- **Acción:** sustituir `#2c2418` (13×), `#6b5f50` (16×), `#555`
  (16×), `#666` (13×), `#ccc` (14×), `#eee` (12×) por los tokens
  decididos.
- **Aceptación:** 0 ocurrencias de esos hex en módulos.
- **Depende de:** TASK-2.2

### TASK-4.4 — Info azul y residuales

- **Tipo:** refactor
- **Esfuerzo:** S
- **Acción:** sustituir `#1f3a8a` (9×), `#fffdf9` (9×) y el resto
  de hex de baja frecuencia (1-8 ocurrencias) por tokens o
  documentar excepción justificada en comentario.
- **Aceptación:** el conteo de hex en módulos baja por debajo de
  un umbral acordado (objetivo: <30 ocurrencias totales).
- **Depende de:** TASK-2.2, TASK-4.1-4.3

---

## Fase 5 — Refactor estructural

Limpieza menor no relacionada con colores. Paralelizable con
fases 1-4.

### TASK-5.1 — Reemplazar magic numbers de `box-shadow`

- **Tipo:** refactor
- **Esfuerzo:** S
- **Acción:** sustituir `box-shadow` con valores ad-hoc por
  tokens `$shadow-sm`, `$shadow-md`, `$shadow-lg`, `$shadow-xl`.
- **Archivos de partida:**
  `grep -rn "box-shadow:.*[0-9]" src/pages src/components --include='*.module.scss'`
- **Aceptación:** sin `box-shadow` con número en módulos (o con
  comentario justificándolo).
- **Depende de:** —

### TASK-5.2 — Resolver `.gallery {}`

- **Tipo:** decision + cleanup
- **Esfuerzo:** XS
- **Acción:** decidir entre **(A)** mantener regla vacía con
  comentario explicando que es semántica para JSX, o **(B)**
  eliminar la regla y aplicar `aria-label` u otro hook semántico
  en `ProductPage.jsx:121`. Aplicar la decisión y, si va por (B),
  reactivar `block-no-empty` en stylelint.
- **Aceptación:** la regla `.gallery {}` desaparece o está
  documentada.
- **Depende de:** —

### TASK-5.3 — Extraer patrón `.iconBtn`

- **Tipo:** structural
- **Esfuerzo:** S
- **Acción:** `Header.module.scss:93,98` hacen `@extend .iconBtn`
  (extensión de selector no-placeholder, code smell). Promover
  a mixin `@mixin icon-btn` en abstracts o a placeholder
  `%icon-btn` en el propio módulo.
- **Aceptación:** ningún `@extend` de selector no-placeholder en
  el proyecto.
- **Depende de:** —

---

## Fase 6 — Endurecer la guarda

Solo arranca cuando el inventario de hex en módulos sea
suficientemente bajo para que el linter no produzca ruido masivo
(objetivo: <30 ocurrencias justificadas).

### TASK-6.1 — Activar `color-no-hex` en módulos

- **Tipo:** enforcement
- **Esfuerzo:** S
- **Acción:** añadir a `.stylelintrc.json` un override que
  prohíba hex en `src/**/*.module.scss`:
  ```json
  "overrides": [{
    "files": ["src/**/*.module.scss"],
    "rules": { "color-no-hex": true }
  }]
  ```
  Para los hex restantes legítimos, añadir
  `/* stylelint-disable-next-line color-no-hex */` con justificación.
- **Aceptación:** `npm run lint:style` pasa en verde. Cualquier
  hex nuevo en un módulo falla el pre-push hook.
- **Depende de:** TASK-3.x, TASK-4.x

### TASK-6.2 — Restringir estilos de import

- **Tipo:** enforcement
- **Esfuerzo:** XS
- **Acción:** evaluar si existe regla de stylelint para forzar
  un patrón de `@use`. Si no, añadir un check en
  `scripts/check-scss.mjs` que falle si encuentra
  `@use '../...'` (paths relativos a abstracts) o
  `@use '@styles/abstracts/(variables|mixins)'` (split).
- **Aceptación:** intentar reintroducir un import relativo a
  abstracts revienta el pre-push hook.
- **Depende de:** TASK-1.2

### TASK-6.3 — Actualizar `docs/scss-pipeline.md`

- **Tipo:** structural
- **Esfuerzo:** XS
- **Acción:** actualizar el checklist de "Añadir un módulo SCSS
  nuevo" con las reglas endurecidas. Marcar `docs/scss-audit.md`
  como histórico (audit del estado pre-remediación).
- **Aceptación:** doc refleja el estado final.
- **Depende de:** TASK-6.1, TASK-6.2

---

## Tabla de progreso

Plantilla para tracking. Cuando se ejecute, marcar estado y
commit hash.

| ID       | Tarea                                  | Estado    | Commit |
|----------|----------------------------------------|-----------|--------|
| TASK-1.1 | Borrar `@keyframes spin` duplicado     | bloqueada |        |
| TASK-1.2 | Unificar imports a `@styles/abstracts` | done      | f3d66d8 |
| TASK-1.3 | Media queries crudas → mixin           | done      | cedc97a |
| TASK-2.1 | Mixins semánticos huérfanos            | done      | a498afe |
| TASK-2.2 | Aprobar nuevos tokens de color         | done      | f09ca5e |
| TASK-2.3 | `%btn`/`%badge` → mixins               | done      | 750dd3b |
| TASK-2.4 | Escalas gray/amber/indigo (expansión)  | done      | 4c3ac58 |
| TASK-3.1 | `#fff` → `$bg-surface`                 | done      | 12303a7 |
| TASK-3.2 | `#b8860b` → `$primary-color`           | done      | fcf23ab |
| TASK-3.3 | `#e8e0d5` → `$border-color`            | done      | 8f335d2 |
| TASK-3.4 | Otros matches exactos                  | done      | 54189f4 |
| TASK-4.1 | Familia danger                         | done      | e72d85a |
| TASK-4.2 | Familia success                        | done      | d9866b5 |
| TASK-4.3 | Familia texto y neutros                | done      | 401931a |
| TASK-4.4 | Info azul y residuales                 | done      | 78a0815 |
| TASK-5.1 | Magic numbers de `box-shadow`          | done      | 4f8a6db |
| TASK-5.2 | Resolver `.gallery {}`                 | done      | 5db21c4 |
| TASK-5.3 | Extraer `.iconBtn`                     | done      | 33881e7 |
| TASK-6.1 | `color-no-hex` en módulos              | done      | 96e7bee |
| TASK-6.2 | Restringir estilos de import           | done      | e8aae95 |
| TASK-6.3 | Actualizar `scss-pipeline.md`          | done      | 0792210 |

## Estimación total

| Fase | Esfuerzo agregado |
|------|-------------------|
| 1    | 1 día             |
| 2    | 1-1.5 días        |
| 3    | 1-2 días          |
| 4    | 2-3 días          |
| 5    | 0.5-1 día         |
| 6    | 0.5 día           |
| **Total** | **6-9 días dev** |

Recomendación de cadencia: 1 fase por sprint, empezando por la 1
y la 3 en paralelo. La 6 solo cuando el inventario lo permita —
forzarla antes genera ruido y desincentiva al equipo.
