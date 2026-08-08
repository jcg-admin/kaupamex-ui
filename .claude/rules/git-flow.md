# Git flow — cheat-sheet (canónico en docs)

Regla completa: `docs/.claude/rules/git-flow.md` — era un **duplicado verbatim** de
8079 B (`diff -q` → idénticos), cargado dos veces en toda sesión con ambos repos en
scope. Reducido a cheat-sheet 2026-08-07 (H-DOCS-97).

Invariante operativo:

`feature/<wp-slug>` → PR → `develop` → PR + bump → `main`. Nunca push directo a
`develop` ni a `main`; nunca `--base main` desde un `feature/*`. Nada de trabajo nuevo
en ramas `claude/*`: al primer commit propio se renombra a `feature/<kebab>`. Una rama
mergeada no recibe más commits — se abre `feature/<slug>-followup` desde `develop`
actualizado. La rama padre obligatoria quedó **derogada** el 2026-07-29 (H-DOCS-04).
