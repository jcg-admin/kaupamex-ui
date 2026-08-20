# Adaptación nativa de componentes UI — puntero al skill

El contenido completo vive ahora en el **skill on-demand** `ui-adaptacion-nativa`
(`.claude/skills/ui-adaptacion-nativa/SKILL.md`). Era una regla siempre-cargada en
`docs` — 6662 B en cada sesión, con contenido 100 % ui y **ausente de este repo**,
que es donde se usa. Migrada 2026-08-07.

Invariante que se conserva aquí porque no puede depender de una invocación:

Los `@progress/kno-*` (`/-progress`) y `ui-core-5.25.0` son **REFERENCIA para
adaptar, NUNCA dependencia de runtime** (DEC-03). `npm install @progress/...` es
siempre la respuesta incorrecta. Se lee la fuente y se reimplementa nativo con
atribución por archivo.

El gate `PreToolUse` (`.claude/hooks/inject_ui_skill_gate.py`) recuerda invocar el
skill al editar `src/components/`, `src/lib/` o `src/hooks/`.
