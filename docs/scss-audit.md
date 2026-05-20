# Auditoría de uso de SCSS

> **Histórico.** Este documento capturó el estado del codebase
> SCSS antes del plan de remediación. La mayoría de los hallazgos
> ya se ejecutaron; ver [`scss-remediation-plan.md`](scss-remediation-plan.md)
> para el plan y su progreso, y [`scss-pipeline.md`](scss-pipeline.md)
> para las guardas actuales.

Análisis del estado real de los estilos del proyecto, complementario
a [scss-pipeline.md](scss-pipeline.md). Aquel describe **cómo no
romper el build**; este describe **qué tan bien se está usando el
sistema** una vez que compila.

Fecha del corte: 2026-05. Métricas obtenidas con `grep` sobre `src/`.

## Resumen ejecutivo

La arquitectura es correcta: barrel `@styles/abstracts`, mixins
componibles, separación clara entre estilos globales y `*.module.scss`,
sin `@import` legacy, sin `:global()` indebido, sin nesting profundo.

El problema no es la arquitectura sino la **disciplina de uso**.
Tres síntomas dominan:

| Síntoma | Magnitud | Severidad |
|---------|----------|-----------|
| Hex literales en lugar de tokens | 525 ocurrencias en 76 archivos | Alta |
| Estilos de importación inconsistentes | 6 variantes distintas | Media |
| Patrones duplicados (keyframes, placeholders) | `@keyframes spin` × 8, `%btn`/`%badge` ad-hoc | Media |

El sistema de design tokens existe y está bien diseñado, pero los
módulos lo esquivan con frecuencia.

## 1. Higiene de imports

**Severidad: media.** El codebase tiene 6 formas distintas de
importar abstracts:

```
36  @use '@styles/abstracts' as *;
20  @use '../../styles/abstracts' as *;
 7  @use '@styles/abstracts/variables' as *;
 7  @use '@styles/abstracts/mixins' as *;
 4  @use '../styles/abstracts' as *;
 4  @use '../../../styles/abstracts' as *;
```

El alias `@styles` (definido en `webpack.config.js:38`) es claramente
el camino preferido (43 archivos), pero conviven con paths relativos
(28 archivos) e imports parcializados sin razón aparente. Mover todo
a `@use '@styles/abstracts' as *` elimina ambigüedad y simplifica
refactors futuros.

**Caveat positivo:** no quedan `@import` legacy. Todo está en el
módulo system moderno.

## 2. Disciplina de tokens vs valores hardcoded

**Severidad: alta.** Esta es la deuda más significativa.

### Colores

525 hex literales en 76 archivos de `*.module.scss`. Muestra
representativa de colores duplicados que ya tienen token:

| Hex hardcodeado | Token equivalente | Aparece en |
|-----------------|-------------------|-----------|
| `#fff`          | `$bg-surface` / `$white` (alias) | múltiples archivos |
| `#b00020`       | `$error-color` (cercano)         | ReturnsPage, SupportTicket*, ProductPage |
| `#1b5e20`       | `$success-color` (cercano)       | ProductPage.module.scss:235 |
| `#2c2418`       | `$text-primary` (cercano)        | ReturnsPage, AdminReturn* |
| `#6b5f50`       | `$text-secondary` (cercano)      | múltiples páginas Returns/Support |
| `#e8e0d5`       | `$border-color`                  | múltiples |
| `#1f7a4d`       | (sin token; reaparece 3+ veces)  | candidato a token nuevo |
| `#4a5fc1`       | (sin token)                      | ReturnDetailPage |

Ejemplo concreto: `src/components/catalog/CatalogFilters.module.scss`
declara seis colores hex propios sin tocar la paleta Yoruba.
`src/pages/catalog/ProductPage.module.scss:230` y `:236` definen
`color: #b00020` y `color: #1b5e20` cuando existen `$error-color` y
`$success-color`.

Cada hex duplicado es un sitio donde un cambio de paleta no se
propaga.

### Espaciado y tipografía

Menos crítico pero presente. ~15 instancias de px en lugar de
`$spacing-*` o sus aliases semánticos (`$space-sm`, `$space-lg`).
Ejemplo: `src/components/catalog/RelatedProductsSection.module.scss:2`
usa `margin: 48px 0 24px` cuando `$spacing-12` y `$spacing-6` ya
existen.

Las tipografías sí están mayoritariamente tokenizadas — esa parte
está sana.

## 3. Salud del namespace de variables y mixins

**Severidad: baja a media.**

### Aliases en `_variables.scss:307-338`

Auditoría rápida — todos están en uso real:

| Alias | Uso |
|-------|-----|
| `$bg-card` | `_modal.scss:18`, `_table.scss:29`, `_progress-bar.scss:60` |
| `$primary-tint` | `_focus-indicators.scss:41`, `_form-stepper.scss:38` |
| `$text-on-btn` | `_progress-bar.scss:79,88`, `_avatar.scss:31` |

Los aliases recién añadidos por el fix anterior (`$color-primary`,
`$color-danger`, `$radius-lg`, etc.) también se están consumiendo
en producción.

### Mixins definidos pero infrautilizados

`_mixins.scss` define cinco mixins semánticos de alto nivel que
**no se usan en ningún `*.module.scss`**:

| Mixin                     | Línea | Usos en módulos |
|---------------------------|-------|-----------------|
| `@mixin page-container`   | 437   | 1               |
| `@mixin page-header`      | 448   | 0               |
| `@mixin loading-state`    | 459   | 0               |
| `@mixin empty-state`      | 468   | 0               |
| `@mixin error-banner`     | 478   | 0               |
| `@mixin success-banner`   | 492   | 0               |

Cada página implementa su propio "loading", "empty", "error banner"
en vez de reutilizar estos. O bien hay que eliminar los mixins
muertos, o documentarlos y migrar las páginas existentes hacia
ellos. Tener ambas variantes (mixin existe + nadie lo usa) es deuda
silenciosa.

## 4. Duplicación que pide mixin

**Severidad: media.**

### `@keyframes spin` redefinido en 8 archivos

```
src/styles/base/_animations.scss:49     (canónico, cargado globalmente)
src/components/shared/LazyLoad/PageLoader.module.scss
src/pages/catalog/CatalogPage.module.scss:59
src/pages/catalog/ProductPage.module.scss:28
src/pages/catalog/CategoryListPage.module.scss:39
src/pages/catalog/SearchResultsPage.module.scss:33
src/pages/admin/AdminUserDetailPage.module.scss:27
src/pages/admin/AdminUsersPage.module.scss
src/pages/account/WishlistPage.module.scss
```

El canónico ya vive en `_animations.scss:49` y se carga vía
`main.scss`. Las 8 redefiniciones locales son bytes muertos y un
ejemplo perfecto de "lo arreglé en mi módulo y no busqué arriba".

### Placeholders `%btn` y `%badge` ad-hoc

Varios módulos definen su propio placeholder y lo `@extend`:

- `src/components/returns/AdminReturnReviewPanel.module.scss:38`
  define `%btn` y lo extiende 3 veces.
- `src/pages/admin/AdminReturnDetailPage.module.scss:60`,
  `src/pages/account/ReturnsPage.module.scss:73`,
  `src/pages/account/SupportTicketDetailPage.module.scss:34`
  redefinen un `%badge` con estructura prácticamente idéntica.

Patrón pidiendo un `@mixin badge-state-variant($color, $bg)` en
abstracts.

## 5. Responsive

**Severidad: media-baja.** El proyecto tiene mixins de breakpoints
(`media-md`, `media-down-md`, etc.) en `_mixins.scss:82-108`, pero
solo 2 archivos los usan. 4 archivos siguen escribiendo
`@media (max-width: 768px)` a mano:

- `src/pages/catalog/CatalogPage.module.scss:110`
- `src/pages/catalog/ProductPage.module.scss:64`
- `src/pages/catalog/SearchResultsPage.module.scss:14`
- `src/pages/cart/CartPage.module.scss:22`

Por suerte usan el mismo `768px` que el token (`$bp-md`), así que la
inconsistencia es solo cosmética hoy. Pero si mañana cambia el
breakpoint, esos cuatro archivos quedan desincronizados.

## 6. Specificity, nesting, `!important`, `@extend`

**Severidad: baja.** Aquí el codebase está sano:

- **Nesting** máximo de 3 niveles en los archivos más densos
  (e.g. `AdminOrderDetailPage.module.scss`). Razonable.
- **`!important`**: 14 ocurrencias, todas justificadas — 9 dentro
  de `@mixin visually-hidden` (a11y), 4 en `@media (prefers-reduced-motion)`,
  1 en Toast para override defensivo. No hay `!important` indisciplinado.
- **`@extend`**: 27 usos. Mayoritariamente extienden placeholders
  (correcto). Excepción: `src/components/layout/Header/Header.module.scss:93,98`
  hace `@extend .iconBtn`, que es señal de patrón reutilizable
  no extraído todavía.
- **CSS Modules vs globales**: limpio. No hay `:global()` en
  el proyecto, los globales viven en `main.scss` y abstractos.

## 7. Código muerto

**Severidad: baja.** Stylelint ya pilla los casos automatizables.
Manualmente solo queda un caso conocido:

- `src/pages/catalog/ProductPage.module.scss:69` → `.gallery {}`.
  Es una clase semántica usada por `ProductPage.jsx:121` sin
  estilos. Stylelint la tolera porque desactivamos `block-no-empty`,
  pero si la convención del equipo es "cada clase rinde", borrar
  la regla y poner un comentario explicativo en JSX sería más
  honesto que un bloque vacío.

## 8. Olores menores

- **Magic numbers en sombras**: por ejemplo
  `src/components/admin/ProductDiscountCreateForm.module.scss:20`
  escribe `box-shadow: 0 12px 48px ...` en vez de usar `$shadow-lg`
  o `$shadow-xl`.
- **Naming**: consistente. CamelCase para clases de módulos
  (`.addToCart`, `.mainImage`), kebab-case para mixins/vars.
  No hay mezcla problemática.

## Priorización de acciones

Ordenado por relación impacto/esfuerzo:

1. **[Alta]** Migrar los 525 hex literales a tokens, archivo por
   archivo. Empezar por las páginas más visitadas
   (`ProductPage`, `CatalogPage`, `CartPage`) y por los códigos
   que se repiten más (`#fff`, `#b00020`, `#1b5e20`, `#2c2418`).
   Añadir un token nuevo para `#1f7a4d` si la marca lo necesita.

2. **[Alta]** Borrar las 8 redefiniciones de `@keyframes spin` y
   confiar en la global de `_animations.scss`. Cero riesgo,
   reducción inmediata de bytes.

3. **[Media]** Unificar imports a `@use '@styles/abstracts' as *;`
   en los 28 archivos que usan paths relativos o split imports.

4. **[Media]** Decidir el destino de `@mixin page-header`,
   `loading-state`, `empty-state`, `error-banner`, `success-banner`:
   o se eliminan (deuda muerta) o se migran las páginas afectadas
   a usarlos.

5. **[Media]** Promover `%btn` y `%badge` duplicados a mixins
   reales en abstracts y refactorizar los 4 archivos que los
   redefinen localmente.

6. **[Media]** Reemplazar los 4 `@media (max-width: 768px)` por
   `@include media-down-md`.

7. **[Baja]** Reemplazar `box-shadow` magic numbers por tokens
   `$shadow-*`.

8. **[Baja]** Eliminar `.gallery {}` migrándolo a un comentario en
   JSX, o reactivar `block-no-empty` en stylelint si el equipo
   prefiere prohibirlo.

## Estrategia de seguimiento

Stylelint y `lint:scss-compile` ya protegen contra **regresiones
estructurales**. Para frenar la deuda de tokens conviene añadir una
regla custom (o un `color-no-hex` de stylelint limitado a `src/**/*.module.scss`)
en una segunda iteración, cuando el inventario de hex se haya bajado
lo suficiente para que el linter no produzca un mar de errores. Si
se activa ahora, el ruido bloqueará todo desarrollo.

Recomendación: arreglar primero los puntos 1 y 2, después activar
`color-no-hex` con allowlist para los colores aún no tokenizados.
