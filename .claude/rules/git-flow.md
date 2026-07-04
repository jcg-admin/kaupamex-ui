```yml
type: Política de Proyecto
category: Git Flow & Branching
version: 1.0.0
created_at: 2026-05-05 15:15:00
updated_at: 2026-05-05 15:15:00
applies_to: e-comerce v1.0.0+
```

# Git Flow — Política de Branching

> Cargado automáticamente. Aplica a TODAS las ramas y merges.
> Reemplaza la práctica anterior de empujar a `claude/*` o
> integrar directo a `develop`.

## Flujo canónico

```
feature/<work-package>
        │
        │  PR
        ▼
feature/solve-problem-docs   (rama de feature padre / integración intermedia)
        │
        │  PR
        ▼
develop   (rama de integración del proyecto)
        │
        │  PR + bump versión
        ▼
main      (releases públicos)
```

**Regla operativa:** ningún `feature/<work-package>` se
integra directamente a `develop` o a `main`. Siempre pasa
primero por `feature/solve-problem-docs`.

## Justificación

`feature/solve-problem-docs` es la rama de feature
**padre** del trabajo en curso del subdominio `docs` de
e-comerce (refactor de gestion, importacion de patrones
de IACT-docs, normalizacion de RNF y casos de uso).
Multiples sub-features la componen, por ejemplo:

- `feature/refactor-gestion`
- `feature/normalizar-rnf`
- otros futuros sub-features

Nota: este patron de feature-padre aplica al submodulo
`docs/`. Los submodulos `api/`, `ui/`, `db/` y `server/`
siguen el mismo esquema con su propia rama padre cuando
se acometen refactors transversales (p.ej.
`feature/upgrade-django-50`, `feature/react-19-migration`).

Mantener una rama padre permite:

- **Aislar el feature completo** del resto de
  integraciones de `develop`.
- **Validar coherencia** entre sub-features antes de
  integrar al tronco.
- **Revert quirúrgico** si la integración a `develop`
  necesita rollback — solo se revierte el merge a
  `develop`, no commits individuales.
- **Code review por sub-feature** sin que cada PR
  exponga 30+ commits a `develop`.

## Reglas

### R-01 — Naming de ramas

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Sub-feature por WP | `feature/<wp-slug>` | `feature/refactor-gestion` |
| Feature padre | `feature/<feature-name>` | `feature/solve-problem-docs` |
| Hot-fix | `hotfix/<issue>` | `hotfix/build-warnings` |
| Auto-generadas Claude Code | `claude/<auto>` | `claude/review-ucs-work-state-phwmj` (NO empujar trabajo nuevo aquí) |

**Prohibido** desde 2026-05-05: empujar trabajo nuevo a
ramas con prefijo `claude/*`. El prefijo `claude/*` es
solo para estados iniciales de Claude Code; al primer
commit propio, renombrar a `feature/<wp-slug>`.

### R-02 — Una rama por WP

Cada Work Package nuevo arranca su propia rama
`feature/<wp-slug>` desde la HEAD actual de
`feature/solve-problem-docs`.

```bash
# arranque correcto de WP
git checkout feature/solve-problem-docs
git pull origin feature/solve-problem-docs
git checkout -b feature/<wp-slug>
```

**Excepción:** si dos WPs comparten estado de trabajo y
son secuencialmente dependientes, pueden compartir rama
con commits separados por WP. Se nota en
`wp-state.md`: `branch: feature/<padre>`.

### R-03 — Target del PR

| Origen | Target | NO target directo |
|--------|--------|-------------------|
| `feature/<wp-slug>` | `feature/solve-problem-docs` | ❌ NO `develop`, ❌ NO `main` |
| `feature/solve-problem-docs` | `develop` | ❌ NO `main` |
| `develop` | `main` | OK (release con bump versión) |
| `hotfix/<issue>` | `main` (ó `develop`) | excepción justificada |

**Regla operativa al abrir PR via `gh pr create`:**

```bash
gh pr create --base feature/solve-problem-docs \
             --head feature/<wp-slug> \
             --title "..." --body "..."
```

NUNCA `--base develop` desde una rama `feature/<wp-slug>`.

### R-04 — Merge strategy

- `feature/<wp-slug>` → `feature/solve-problem-docs`:
  **merge commit** (preserva historia del sub-feature
  como bloque). Si el sub-feature es trivial (1-2
  commits), aceptar **squash**.
- `feature/solve-problem-docs` → `develop`: **merge
  commit** obligatorio.
- `develop` → `main`: **merge commit** + bump versión
  semver.

NUNCA force-push a `feature/solve-problem-docs`,
`develop` o `main`.

### R-05 — Verificación pre-PR

Antes de abrir PR de `feature/<wp-slug>` →
`feature/solve-problem-docs`:

```bash
# Working tree limpio
git status --short    # debe estar vacío
# Sincronizado con remote
git fetch origin
git log origin/feature/<wp-slug>..HEAD    # debe estar vacío (todo pusheado)
# Build limpio
make html             # exit 0, 0 warnings nuevos
# Pre-render PlantUML limpio
python3 scripts/prerender-plantuml.py 2>&1 | tail -3
```

### R-06 — Sin polución post-merge

Una rama mergeada NO recibe nuevos commits. Si tras un
merge se descubre trabajo adicional para el mismo WP,
abrir un nuevo `feature/<wp-slug>-followup` desde
`feature/solve-problem-docs` ACTUALIZADO.

```bash
# INCORRECTO (polución post-merge)
git checkout claude/wp-merge-pr-review   # rama ya mergeada
git commit -m "more work"                 # ❌ NO

# CORRECTO
git checkout feature/solve-problem-docs
git pull
git checkout -b feature/wp-followup
git commit ...
```

### R-07 — Verificación de integración

Antes de declarar un WP "merged":

```bash
git fetch origin
git log origin/feature/solve-problem-docs..origin/feature/<wp-slug>
# debe estar vacío (todos los commits del feature están en el padre)
```

Si hay commits ahead, el merge no se completó
correctamente o hay conflicto sin resolver.

### R-08 — Limpieza de ramas mergeadas

Tras merge a `feature/solve-problem-docs`:

- Local: `git branch -d feature/<wp-slug>` (NO `-D`).
- Remote: dejar la rama 30 días para auditoría;
  borrar después o si bloquea (rate limits, listing).
  Borrar via GitHub UI o:
  `git push origin --delete feature/<wp-slug>`.

## Flujo histórico (post-mortem y aprendizaje)

| Fecha | Evento | Lección |
|-------|--------|---------|
| 2026-05-04 | PR #11 mergeada (`claude/review-ucs-work-state-phwmj` → `feature/solve-problem-docs`) | OK — claude/* puede mergearse si su scope es claro |
| 2026-05-05 | PR #13 mergeada (`claude/wp-merge-pr-review` → `feature/solve-problem-docs`) | OK |
| 2026-05-05 | Trabajo continuó en `claude/wp-merge-pr-review` POST-MERGE (~30 commits) | **R-06 violado** — polución post-merge |
| 2026-05-05 | Creé `feature/cnst-033-uml-conformance` desde la rama polucionada | Recovery: consolidé en `feature/cnst-033-uml-conformance` |
| 2026-05-05 | Creé `feature/use-case-view-deep-audit` (sub-rama de cnst-033) | **R-02 dudoso** — eran WP secuenciales, mergeé y borré |
| 2026-05-05 | Intenté integrar a `develop` directo | **R-03 violado** — corrigió ejecutor, target debe ser `feature/solve-problem-docs` |

## Reglas de oro

1. **Verifica branch al iniciar WP**:
   `git branch --show-current` debe ser
   `feature/<wp-slug>` o `feature/solve-problem-docs`.

2. **Antes de pushear**: `git push --dry-run` para
   confirmar destino.

3. **Si dudas el target del PR**: target =
   `feature/solve-problem-docs`. SIEMPRE.

4. **Si una rama ya está mergeada**: NUNCA commitees
   más en ella. Crea una nueva.

5. **Una sola rama activa por WP**, salvo declaración
   explícita en `wp-state.md` de WP secuencial.
