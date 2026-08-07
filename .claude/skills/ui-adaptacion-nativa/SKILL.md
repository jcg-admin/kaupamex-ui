---
name: ui-adaptacion-nativa
description: "Use when porting or improving a UI component/utility in kaupamex-ui from the reference packages @progress/kno-* (/-progress) or ui-core-5.25.0. Covers the native-porting premise (DEC-03: reference to adapt, NEVER a runtime dependency), the read procedure (.d.ts for the contract, .mjs for behaviour), mandatory per-file attribution, the Definition of Done, and why kno-licensing blocks nothing. Invoke BEFORE writing any component under src/components/, src/lib/ or src/hooks/."
allowed-tools: Read Glob Grep Bash
layer: frontend
project: kaupamex
origen: era .claude/rules/adaptacion-componentes-nativa.md en docs (siempre-cargada);
  migrada a skill on-demand 2026-08-07 — su contenido es 100 % ui.
---

# Adaptación nativa de componentes UI (referencia `/-progress`, `/ui-core-*`)

Creado: 2026-07-04T07:30:47

## Regla

Los paquetes `@progress/kno-*` (knoReact, **open source**) y `ui-core-5.25.0`
en `/home/user/-progress/` y `/home/user/ui-core-5.25.0/` son **material de
REFERENCIA para adaptar, NO dependencias de runtime**. `kaupamex-ui`
**no instala ninguno** (`package.json` → 0 paquetes `@progress/*`).

La premisa del proyecto es **portación nativa** (iniciativa
`adaptar-template-ui-nativo`, DEC-03): *"importar `kno-*` como dep runtime
**viola la premisa**"*. Se reimplementa el componente localmente leyendo la
fuente de `/-progress` como referencia.

Por lo tanto, al elegir "qué tomamos de `/-progress` o `/ui-core`" para mejorar
algo, la respuesta correcta **nunca** es `npm install @progress/kno-...`. Es:
*leer la referencia y adaptar nativo*.

## El flujo de integración (procedimiento)

Enunciado canónico (del audit `reporte-mapeo-kno-componentes-ucs-ui`): los
`kno-*` son **referencias adaptables**: *se lee su `dist` legible (`.mjs`) y se
**reimplementa nativo** en `kaupamex-ui` con atribución por archivo. Mismo
método ya usado para `DataTable`, `lib/dateMath` y `lib/dataQuery`.*

1. **Leer la referencia** en `/-progress/<paquete>/` (o `/ui-core-*`) — dos
   lecturas complementarias:
   - **`*.d.ts`** → la **superficie de props / contrato público** (p.ej.
     `textbox/Textbox.d.ts`: `size`, `fillMode`, `valid`, `prefix/suffix`,
     `onChange`).
   - **`dist` / `*.mjs`** (legible) → el **comportamiento** (p.ej.
     `input/InputValidationIcon.mjs`, el schema del editor, el cálculo de
     posición). Anotar `:nivel_evidencia:` = lectura directa del paquete.
2. **Reimplementar nativo** preservando el contrato público (mismos
   props/retorno) para no tocar a los consumidores:
   - Componentes → `src/components/common/...` (`Button` ← `kno-react-buttons`).
   - Utilidades/algoritmos → `src/lib/*.js` (`dataQuery.js` ← `kno-data-query`,
     `dateMath.js` ← `kno-date-math`, `fileSaver.js`, `csvExporter.js`,
     `intl.js`, `sanitize.js`).
   - Posicionamiento flotante → `src/hooks/ui/useFloating.js` (de `@floating-ui`,
     sin instalarlo).
3. **Atribución por archivo (obligatoria).** Cada archivo portado lleva un
   comentario de cabecera:
   `// Adaptado de @progress/kno-<paquete> — referencia no runtime`.
4. **Seguridad con deps YA instaladas**: si hace falta sanitizar HTML (editor
   rich-text), usar `dompurify` (`^3.4.1`, ya presente) — no una dep nueva.
5. **Definition of Done** (criterio de cierre del marco `adaptar-template-ui-nativo`):
   portado nativo + **tests del contrato verdes** + `check:lazy` exit 0 +
   `check:canon` + `stylelint` + build + **atribución por archivo**. Sin
   `React.lazy` salvo code-splitting.
6. **NO** agregar `@progress/*` ni binarios pesados (`kno-ooxml`) a
   `dependencies`.

## Antes de portar / de crear un análisis

1. **Buscar el mapeo existente**: `reporte-mapeo-kno-componentes-ucs-ui` ya
   clasifica los 70 paquetes (ADOPTAR / REQUIERE-UC / YA-CUBIERTO /
   FUERA-DE-SCOPE) y mapea a UCs. Actualizar ese audit; **no crear iniciativa
   paralela** (`grep -rl` en `source/gestion/pm/ui/` primero).
2. **Verificar que ningún primitivo actual ya lo cubre** (evitar duplicar).
3. Un componente sólo se porta si hay una **pantalla/flujo que lo requiere**
   (estado ADOPTAR con UC), no "por completitud".

## Sobre tiers "free vs premium" y license keys

`/-progress` es **open source**: no se basa en ningún modelo premium. El texto
de "premium / license key" que aparecía en algunos READMEs (p.ej. el **Editor**
WYSIWYG) era **texto de marketing del README original de knoReact (upstream)**
y **NO aplica** a este repositorio — de hecho el mantenedor lo removió en
``/-progress@319851e``. `kno-licensing` aparece en `peerDependencies`, pero es
irrelevante
por dos razones: (1) el repo es open source, y (2) adaptamos nativo — **no
instalamos ni ejecutamos** el paquete, así que nunca se toca el camino de
instalación ni ningún license key. Reimplementar la *funcionalidad* (toolbar +
`contentEditable` + sanitizado con `dompurify`) es limpio y sin fricciones.

## Meta-lección (por qué existe esta regla)

**Fallo registrado (2026-07-04):** se afirmó que `kno-react-editor` estaba
"bloqueado por `kno-licensing` (licencia pagada)" **concluyéndolo desde los
`peerDependencies` del manifiesto**, sin verificar el camino de integración
real del proyecto. Era un doble error:

1. Afirmación de un hecho de infra/dependencia **desde la lectura del manifiesto
   en vez del flujo real** (los peers describen el camino de *install*, que aquí
   no se usa). Viola `react-verification-gate.md` §1-bis.
2. La conclusión ("nos bloquea") era falsa: la vía nativa no instala nada.

**Antes de concluir que una dependencia/licencia "nos bloquea": verificar el
camino de integración que el proyecto realmente usa** (¿se instala? ¿o se adapta
nativo?). Citar `package.json` (qué está instalado) y la premisa de portación
nativa, no solo el manifiesto del paquete de referencia.

## Verificación

```bash
# ¿Está instalado algún @progress/kno-* como dep runtime? (esperado: NONE)
python3 -c "import json;d=json.load(open('package.json'));\
deps={**d.get('dependencies',{}),**d.get('devDependencies',{})};\
print([k for k in deps if 'kno' in k or 'kendo' in k or 'progress' in k] or 'NONE')"
```

## Antes de crear un análisis nuevo: buscar el que ya existe

El mapeo de los 70 paquetes `kno-*` → UCs/adopción **ya está hecho** en
`source/gestion/pm/ui/audits/reporte-mapeo-kno-componentes-ucs-ui.rst`
(4 estados: ADOPTAR / REQUIERE-UC / YA-CUBIERTO / FUERA-DE-SCOPE; incluye que
`kno-licensing` **no aplica**). El **procedimiento de lectura** de la referencia
(leer `.d.ts` para el contrato + `.mjs` para el comportamiento) está en
`.../corregir-admin-buyer-ux/analisis-adaptar-kno-react-inputs-admin.rst`.
**No crear una iniciativa/análisis paralelo**: actualizar el audit canónico.

## Referencias

- **Mapeo canónico** de kno-* → UCs/adopción:
  `gestion/pm/ui/audits/reporte-mapeo-kno-componentes-ucs-ui.rst`.
- **Procedimiento de lectura** (ejemplo trabajado): `.../corregir-admin-buyer-ux/
  analisis-adaptar-kno-react-inputs-admin.rst`.
- Iniciativa marco `gestion/pm/ui/iniciativas/adaptar-template-ui-nativo/`
  (analisis + decisiones: DEC-03 native-only, lista de adaptados).
- `react-verification-gate.md` §1-bis (hechos de infra/dep no se afirman de
  memoria/manifiesto sin comando o runbook que los respalde).
- Episodio: `gestion/pm/ui/lecciones-aprendidas/l-ui-01-adaptacion-nativa.rst`.
