---
name: ui-interfaz-en-implementacion
description: "Use when implementing or modifying any UI surface in kaupamex-ui (page, section, modal, component with its own visible surface). Defines the DoD of the pass: an interfaz-<slug>.rst with ASCII mockup + interface spec + states, AND a Playwright E2E with a curated screenshot. Neither may be deferred to a future improvement initiative. Invoke BEFORE writing a page/component with visible surface."
allowed-tools: Read Glob Grep Bash
layer: frontend
project: kaupamex
origen: era .claude/rules/ui-documentacion-en-implementacion.md en docs
  (siempre-cargada); migrada a skill on-demand 2026-08-07.
---

# Documentación de interfaz de UI en el pase de implementación

Creado: 2026-07-11T01:27:21
Canon: `source/normativa/estandares/metodologia/documentacion-interfaz-en-implementacion.rst`
(`:ref:` ``ui-documentada-en-implementacion``)

> Cargado automáticamente. Aplica a TODA implementación de UI (páginas,
> apartados, modales, componentes con superficie visible propia).

## Regla

**Toda implementación de UI registra cómo queda su interfaz en el MISMO pase de
implementación — nunca se difiere a una iniciativa futura de "mejora".**

Si un cambio agrega/modifica una superficie visible, se produce y commitea un
documento `interfaz-<slug>.rst` **y** un E2E Playwright con screenshot, junto con
el código. Ambos son parte del DoD de UI: sin ellos, la tarea **no se cierra**
(gate `proc-gestion-backlog` Paso 6: capa 5 = doc de interfaz, capa 7 = E2E+shot).

## Contenido mínimo del `interfaz-<slug>.rst`

1. **Ubicación** — route + lugar en la navegación + control de acceso.
2. **Mockup en ASCII** — refleja el estado *implementado*, no una aspiración
   (portable, versionable en git; mismo criterio que la base cognitiva).
3. **Spec de interfaz** — tabla que mapea cada elemento (tab/input/filtro/
   columna/botón/paginación) a su contrato: query param / campo de API / acción.
4. **Estados** — cargando / vacío / error + accesibilidad (`aria-*`, roles).
5. **Componentes reutilizados** — nativos (regla `adaptacion-componentes-nativa`,
   sin `@progress` runtime). Adoptar los primitivos ya existentes (`Tabs`,
   `Alert`, `DataTable`, `lib/intl`, …) en vez de reimplementar a mano.
6. **Trazabilidad** — `ui@hash` / `api@hash`, UC y diseño (capa 3/5).
7. **Evidencia E2E (OBLIGATORIA)** — spec `e2e/<slug>.e2e.js` (Playwright/
   Chromium ya instalado; `npm run e2e`) que navega la vista y captura
   **screenshot**. Dos niveles de imagen:
   - transitorio: `ui: e2e/artifacts/<slug>.png` git-ignored (el **spec** sí se
     versiona);
   - **curado versionado**: copia de cierre en
     `docs: source/_static/img/evidencia/<iniciativa-slug>/<vista>-<verbo>-<ISO>.png`,
     consumido con `.. figure:: /_static/img/evidencia/<iniciativa-slug>/<vista>-<verbo>-<ISO>.png`.
     Es el que sirve para auditoría/COSMIC/cierre. **Nombre `<vista>-<verbo>-<ISO>.png`:**
     `<verbo>` = operación evidenciada (`get`/`post`/`update`/`delete`…) porque
     una vista tendrá varias evidencias; `<ISO>` por `date -u` (`:`→`-`, como
     build-logs). **Las capturas de error se preservan con su fecha, no se
     sobrescriben** (un fix posterior añade otra imagen con otro `<ISO>`). Un
     screenshot en **estado de error NO satisface la capa 7**. Convención de
     carpetas: `_static/img/` raíz = marca; `_static/img/evidencia/<slug>/` =
     evidencia; PlantUML en `_static/_generated_diagrams/`.

## Cuándo NO aplica

Refactors internos sin cambio visible, renames, fixes de lógica que no alteran
la interfaz, cambios de estilo triviales (token de color). Esos van al
`progreso`/hallazgo, no exigen mockup.

## Por qué

Cierra el ciclo de `docs-design-first-rup` (diseño antes de construir → lo
construido vuelve a docs como estado real). Es la contraparte de implementación
de la técnica **UI-Driven** (`fnd-03` §5.4): UI-Driven deriva UC desde mockups;
esta regla exige devolver el mockup real. Prohíbe el anti-patrón "lo documento/
mejoro en una iniciativa futura": si se puede hacer bien ahora, se hace ahora.

## Precedente

`interfaz-adminlogspage.rst` (visor de logs UC-ADM-06, `ui@6111963`).

## Severidad

**MEDIA** — sin la regla, la capa 5 queda desalineada del código construido y se
acumula deuda "código sin su interfaz documentada".
