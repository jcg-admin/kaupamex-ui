#!/bin/bash
# =============================================================================
# scripts/install-hooks.sh — activa los hooks de .githooks/ en este clone.
# =============================================================================
# Idempotente: ejecuta 'git config core.hooksPath .githooks' relativo a
# la raiz del submodulo ui/.
#
# Instala TODOS los hooks vendored en .githooks/ (chmod + core.hooksPath):
#   - pre-commit  -> gates zero lazy imports + canon-idioma en src/**.
#   - commit-msg  -> convencion Tim Pope (.claude/rules/commit-conventions.md).
# Ver docs/source/gestion/pm/ui/iniciativas/eliminar-lazy-imports-ui/.
# =============================================================================
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.githooks"

if [[ ! -d "$HOOKS_DIR" ]]; then
    echo "ERROR: $HOOKS_DIR no existe" >&2
    exit 1
fi

git config core.hooksPath .githooks
chmod +x "$HOOKS_DIR"/*

echo "OK: hooks activados (core.hooksPath = .githooks)"
echo "    Hooks instalados:"
for h in "$HOOKS_DIR"/*; do
    [[ -f "$h" ]] || continue
    echo "    - $(basename "$h")"
done
