```yml
type: Política de Proyecto
category: Git Flow & Branching
version: 1.0.0
created_at: 2026-05-05 15:15:00
updated_at: 2026-05-05 15:15:00
applies_to: kaupamex v1.0.0+
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
develop   (rama de integración del proyecto)
        │
        │  PR + bump versión
        ▼
main      (releases públicos)
```

**Regla operativa:** un `feature/<work-package>` abre PR **a `develop`**. Nunca
se empuja directo a `develop` ni a `main`.

## Derogada: la rama padre obligatoria (2026-07-29)

Hasta esta fecha la regla exigía que **todo** `feature/<wp>` pasara primero por
`feature/solve-problem-docs`. Se deroga por dos razones medidas, no por
preferencia:

1. **La rama no existe.** `git ls-remote --heads origin | grep solve-problem-docs`
   → **0 de 14** heads remotos en `docs`. Una regla que manda enrutar por una
   rama ausente no se puede cumplir: garantiza que se viole en cada PR.
2. **Contradecía otra regla del mismo monorepo.** `api` lleva
   `.claude/rules/git-workflow.md`, que prescribe `feature/*` → PR → `develop`
   directo. Dos reglas cargadas en la misma sesión mandaban rutas distintas; la
   que coincide con la realidad ejecutada es la de `api`.

**Precedente que la cierra:** la integración del 2026-07-29 llevó seis PRs de
`feature/*` a `develop` por decisión explícita del ejecutor ("vamos a hacer los
pr y merge hacia develop"). Esta regla ahora **describe** lo que se hizo, en vez
de mandar lo contrario. Ver H-DOCS-04 en
`docs: source/gestion/pm/docs/audits/hallazgos-integrar-ramas-a-develop.rst`.

**La rama padre sigue disponible como recurso, no como obligación.** Cuando un
refactor transversal se compone de varios sub-features que conviene validar
juntos antes de tocar el tronco, se crea una rama padre explícita
(`feature/<tema>`) y se declara en el `progreso-<slug>.rst` de la iniciativa.
Sus ventajas siguen siendo reales — aislar el feature completo, revert
quirúrgico de un solo merge, review por sub-feature sin exponer 30+ commits a
`develop`. Lo que se deroga es imponerla **siempre**, y hacerlo nombrando una
rama que no existe.

## Reglas

### R-01 — Naming de ramas

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| Sub-feature por WP | `feature/<wp-slug>` | `feature/refactor-gestion` |
| Feature padre (OPCIONAL, ver derogación) | `feature/<tema>` | `feature/hito-l0-billing-recurrente` |
| Hot-fix | `hotfix/<issue>` | `hotfix/build-warnings` |
| Auto-generadas Claude Code | `claude/<auto>` | `claude/review-ucs-work-state-phwmj` (NO empujar trabajo nuevo aquí) |

**Prohibido** desde 2026-05-05: empujar trabajo nuevo a
ramas con prefijo `claude/*`. El prefijo `claude/*` es
solo para estados iniciales de Claude Code; al primer
commit propio, renombrar a `feature/<wp-slug>`.

### R-02 — Una rama por WP

Cada Work Package nuevo arranca su propia rama
`feature/<wp-slug>` desde la HEAD actual de `develop` (o de la rama
padre, si la iniciativa declaró una).

```bash
# arranque correcto de WP
git checkout develop
git pull origin develop
git checkout -b feature/<wp-slug>
```

**Excepción:** si dos WPs comparten estado de trabajo y
son secuencialmente dependientes, pueden compartir rama
con commits separados por WP. Se nota en
`wp-state.md`: `branch: feature/<padre>`.

### R-03 — Target del PR

| Origen | Target | NO target directo |
|--------|--------|-------------------|
| `feature/<wp-slug>` | `develop` | ❌ NO `main` |
| `feature/<tema>` (padre, si existe) | `develop` | ❌ NO `main` |
| `develop` | `main` | OK (release con bump versión) |
| `hotfix/<issue>` | `main` (ó `develop`) | excepción justificada |

**Regla operativa al abrir PR via `gh pr create`:**

```bash
gh pr create --base develop \
             --head feature/<wp-slug> \
             --title "..." --body "..."
```

NUNCA `--base main` desde una rama `feature/<wp-slug>`.

### R-04 — Merge strategy

- `feature/<wp-slug>` → `develop`: **merge commit**
  (preserva historia del sub-feature como bloque). Si el
  sub-feature es trivial (1-2 commits), aceptar **squash**.
- `feature/<tema>` (padre) → `develop`: **merge commit**
  obligatorio.
- `develop` → `main`: **merge commit** + bump versión
  semver.

NUNCA force-push a `develop` ni a `main`. En `feature/*`
y `claude/*` se admite `--force-with-lease` (ver
`git-author-identity.md`).

### R-05 — Verificación pre-PR

Antes de abrir PR de `feature/<wp-slug>` → `develop`:

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
`develop` ACTUALIZADO.

```bash
# INCORRECTO (polución post-merge)
git checkout claude/wp-merge-pr-review   # rama ya mergeada
git commit -m "more work"                 # ❌ NO

# CORRECTO
git checkout develop
git pull
git checkout -b feature/wp-followup
git commit ...
```

### R-07 — Verificación de integración

Antes de declarar un WP "merged":

```bash
git fetch origin
git log origin/develop..origin/feature/<wp-slug>
# debe estar vacío (todos los commits del feature están en develop)
```

Si hay commits ahead, el merge no se completó
correctamente o hay conflicto sin resolver.

### R-08 — Limpieza de ramas mergeadas

Tras merge a `develop`:

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
| 2026-07-29 | Seis PRs de `feature/*` → `develop` por directiva del ejecutor | **R-03 derogado** — la rama padre obligatoria ya no aplica (ver la sección de derogación) |

**Las filas de 2026-05 se conservan verbatim**: son memoria episódica, no la
regla vigente. La lección de la última fila (`target debe ser
feature/solve-problem-docs`) **quedó superada el 2026-07-29** — se lee como
registro de lo que la regla decía entonces, no como instrucción de hoy.

## Reglas de oro

1. **Verifica branch al iniciar WP**:
   `git branch --show-current` debe ser
   `feature/<wp-slug>` — nunca `develop` ni `main`.

2. **Antes de pushear**: `git push --dry-run` para
   confirmar destino.

3. **Si dudas el target del PR**: target = `develop`.
   SIEMPRE (`main` sólo desde `develop`, con bump).

4. **Si una rama ya está mergeada**: NUNCA commitees
   más en ella. Crea una nueva.

5. **Una sola rama activa por WP**, salvo declaración
   explícita en `wp-state.md` de WP secuencial.
