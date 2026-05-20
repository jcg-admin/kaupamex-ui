# Pipeline de SCSS y guardas de calidad

Este documento describe cómo se compilan los estilos, por qué Jest no
detecta SCSS roto, y qué capas de protección están en su sitio para
que esa deuda no vuelva a entrar silenciosamente.

Documentos relacionados:
- [`scss-audit.md`](scss-audit.md) — auditoría del estado
  pre-remediación (histórico).
- [`scss-remediation-plan.md`](scss-remediation-plan.md) — plan
  ejecutado para bajar de 525 hex literales a 17.

## Contexto

El proyecto usa SCSS Modules (`*.module.scss`) más una capa global
(`src/styles/`). En noviembre de 2026 un `npm run build` falló con 52
errores de `Undefined mixin` / `Undefined variable` mientras los 771
tests de Jest seguían en verde. La causa no fue un solo fallo, sino
un patrón acumulado que pasó por varios merges sin que nadie lo
notara.

## El gap que permitió la deuda

Jest carga los archivos `*.module.scss` a través de un mock
(`identity-obj-proxy` o equivalente). Eso significa que **`sass-loader`
nunca se ejecuta dentro del runner de tests**: cualquier
`@include mixin-inexistente;` o `$variable-inexistente` es invisible
para el suite.

El único punto donde se compilaba SCSS de verdad era `webpack build`,
y no estaba enchufado a ningún hook ni CI step. Con esa configuración,
la única forma de descubrir un módulo SCSS roto era que alguien lo
ejecutara localmente.

## Arquitectura de estilos

```
src/styles/
├── abstracts/
│   ├── _variables.scss   Tokens (colores, espaciado, tipografía, sombras)
│   ├── _mixins.scss      Mixins reutilizables (btn-*, flex-*, card-*)
│   └── _index.scss       Barrel: @forward 'variables' + 'mixins'
├── base/                 Reset, typography, animations
├── components/           Estilos globales (.btn, .card, .form...)
└── main.scss             Entry point global
```

Cada `*.module.scss` importa los abstracts vía el alias `@styles`
(definido en `webpack.config.js`):

```scss
@use '@styles/abstracts' as *;
```

Si un módulo necesita funciones del módulo `sass:color`, debe
declararlo explícitamente:

```scss
@use 'sass:color';
@use '@styles/abstracts' as *;

.foo:hover { background: color.adjust($primary-color, $lightness: -5%); }
```

### Convenciones de naming

`_variables.scss` mantiene dos familias en paralelo a propósito:

| Canónico             | Alias (estilo Bootstrap) |
|----------------------|--------------------------|
| `$primary-color`     | `$color-primary`         |
| `$error-color`       | `$color-danger`, `$color-error` |
| `$text-primary`      | `$color-text`            |
| `$bg-surface`        | `$surface`, `$white`     |
| `$bg-sunken`         | `$bg-subtle`, `$bg-muted`|
| `$border-radius-lg`  | `$radius-lg`             |
| `$font-size-4xl`     | `$font-size-display`     |

La sección "ALIASES" al final de `_variables.scss` es el sitio
correcto para añadir nuevos atajos. **No introduzcas un nombre
alternativo sin registrarlo allí**, o la próxima vez romperá el
build.

Lo mismo aplica a los mixins de botón: cualquier `@include btn-foo`
nuevo debe tener su definición en `_mixins.scss`.

## Capas de protección

Tres comandos cubren el espectro completo. Pueden ejecutarse
manualmente o vía hook (ver siguiente sección).

| Comando                    | Qué valida                                    | Coste |
|----------------------------|-----------------------------------------------|-------|
| `npm run lint:style`       | Reglas stylelint (duplicados, sintaxis...)    | ~2s   |
| `npm run lint:scss-compile`| Compila los 102 entries con dart-sass         | ~3s   |
| `npm run build`            | Bundle completo de producción                 | ~12s  |

### `npm run lint:style`

Stylelint con `stylelint-config-standard-scss`, ajustado a las
convenciones del equipo. La config vive en `.stylelintrc.json`. Se
desactivaron reglas estilísticas que peleaban con el código existente
(colons alineados, `@use ... as *`) y se mantuvieron las que atrapan
deuda real (duplicate properties, naming patterns, global function
names, etc.).

Reglas estrictas activas a partir de Fase 6:

- **`block-no-empty`** — reglas vacías como `.gallery {}` fallan.
  Si una clase es solo semántica para JSX, no la declares en SCSS;
  usa el elemento HTML semántico (`<section aria-label>`) en su
  lugar.
- **`color-no-hex`** (scoped a `src/**/*.module.scss`) — cualquier
  hex literal nuevo en un módulo falla. Los 17 hex que sobrevivieron
  a la migración tienen un `/* stylelint-disable-next-line
  color-no-hex */` justificado encima.

Autofix disponible: `npm run lint:style:fix`.

### `npm run lint:scss-compile`

Script propio en `scripts/check-scss.mjs`. Hace dos pasadas:

1. **Compilación** — todos los entries SCSS (no parciales) con
   dart-sass usando un importer custom que replica el alias
   `@styles` de webpack. Detecta `Undefined mixin/variable`,
   `There is no module with namespace ...`, y cualquier error de
   compilación sin necesidad de levantar webpack.
2. **Estilo de import** (añadido en Fase 6) — escanea cada
   `*.module.scss` bajo `src/pages`, `src/components` y
   `src/layouts` y rechaza imports de abstracts que no usen la
   forma canónica. Patrones inválidos:

   ```scss
   @use '../../styles/abstracts' as *;       // path relativo
   @use '@styles/abstracts/variables' as *;  // barrel partido
   @use '@styles/abstracts/mixins' as *;     // barrel partido
   ```

   Solo `@use '@styles/abstracts' as *;` pasa.

### `npm run build`

Bundle de producción completo. Es la guarda definitiva pero la más
cara. Se reserva para CI.

## Pre-push hook

`.husky/pre-push` corre `lint:style` + `lint:scss-compile` antes de
cada `git push`. Si alguno falla, el push se aborta.

```sh
#!/usr/bin/env sh
set -e
npm run --silent lint:style
npm run --silent lint:scss-compile
```

Husky se instala automáticamente al hacer `npm install` gracias al
script `prepare` en `package.json`. Un clon nuevo del repo hereda
el guard sin pasos manuales.

Bypass de emergencia (úsalo solo si sabes qué haces, y abre un
follow-up para arreglar lo que omitiste):

```bash
git push --no-verify
```

## Añadir un módulo SCSS nuevo

Checklist mínima:

1. Importar abstracts con el alias canónico:
   `@use '@styles/abstracts' as *;`
   Imports relativos (`../../styles/abstracts`) o partidos
   (`@styles/abstracts/variables` + `@styles/abstracts/mixins`)
   son rechazados por `lint:scss-compile`.
2. Si vas a usar `color.adjust` u otra función del módulo
   `sass:color`, añadir `@use 'sass:color';` arriba.
3. **Cero hex literales nuevos.** Usa tokens de `_variables.scss`.
   Si la paleta no cubre el color que necesitas, añade el token
   primero (sección correspondiente: estado, neutros, escala
   gray/amber/indigo) en lugar de inline. Si es genuinamente un
   one-off justificable, añade
   `/* stylelint-disable-next-line color-no-hex */` con razón
   en el commit.
4. Usar nombres ya definidos. Si necesitas un alias nuevo,
   regístralo en la sección "ALIASES" de `_variables.scss` en vez
   de improvisar en el módulo.
5. No declares reglas vacías (`.foo {}`). Si la clase es solo
   semántica para JSX, omite el `className` y usa marcado HTML
   semántico (`<section aria-label="...">`).
6. Antes de pushear, corre `npm run lint:scss-compile` y
   `npm run lint:style` para verificar — el hook lo hará por ti,
   pero descubrirlo localmente es más rápido.

## Troubleshooting

**El hook tarda demasiado en mi máquina.** El cuello de botella es
sass compilando 100+ archivos. Si pasa de ~10s, comprueba que no
estés en watch mode de otra herramienta consumiendo CPU.

**Stylelint reporta un error que parece falso positivo.** Antes de
desactivar la regla globalmente, valida que sea ruido real para
todo el proyecto. Para excepciones puntuales:

```scss
/* stylelint-disable-next-line declaration-block-no-duplicate-properties */
font-size: $font-size-base;
font-size: 11px;
```

**`lint:scss-compile` falla con `Can't find stylesheet`.** El alias
`@styles` se resuelve en `scripts/check-scss.mjs:14`. Si añades un
alias nuevo en `webpack.config.js`, replícalo allí también.

**`lint:scss-compile` falla con `relative path; use @use ...`** o
**`split import`.** Tu nuevo módulo está usando una de las formas
rechazadas. Cámbialo a `@use '@styles/abstracts' as *;`. El barrel
re-exporta variables y mixins, no necesitas dos imports separados.

**`lint:style` falla con `Disallowed hex color`.** Sustituye el hex
por el token equivalente en `_variables.scss` (preferido). Si el
color es realmente nuevo, añade el token primero. Solo en último
recurso usa `/* stylelint-disable-next-line color-no-hex */`
y explica por qué en el commit.

**Quiero añadir eslint o tests al pre-push.** Edita `.husky/pre-push`
añadiendo las líneas correspondientes. Considera el impacto en el
tiempo total: el hook actual es de ~5s; añadir `npm test` lo lleva a
~40s, que empieza a ser doloroso.
