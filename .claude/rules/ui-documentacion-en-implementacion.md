# UI documentada en implementación — puntero al skill

El contenido completo vive ahora en el **skill on-demand**
`ui-interfaz-en-implementacion` (`.claude/skills/ui-interfaz-en-implementacion/SKILL.md`).
Canon RST: `docs: source/normativa/estandares/metodologia/documentacion-interfaz-en-implementacion.rst`.
Migrado 2026-08-07 desde `docs/.claude/rules/` (3710 B siempre-cargados de contenido ui).

Invariante que se conserva aquí:

Toda implementación de UI con superficie visible registra su interfaz en el MISMO
pase: `interfaz-<slug>.rst` (mockup ASCII + spec + estados) **y** un E2E Playwright
con screenshot curado. Ambos son DoD — nunca se difieren a una iniciativa de
"mejora". El gate `PreToolUse` lo recuerda al editar `src/pages/` o `src/components/`.
