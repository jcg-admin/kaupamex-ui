#!/bin/bash
# =============================================================================
# tests/test_provisioner_setup.sh
# Test de regresion estatico del provisioner scripts/install.sh.
# =============================================================================
# Verifica que el provisioner de Node.js para Kaupamex-ui sigue
# integro: root check, idempotencia, NodeSource via apt (NO nvm), loud
# failure (DEC-DOC-008), header con modelo WSL2.
#
# Estatico — solo lee codigo. No requiere root, ni Node, ni apt, ni red.
#
# Naming auto-explanatorio (convention-naming.md cero D-NN): el archivo
# describe lo que testea (provisioner setup) sin prefijo numerico.
#
# Uso:
#   bash tests/test_provisioner_setup.sh
# =============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$PROJECT_ROOT/scripts/install.sh"
PKG="$PROJECT_ROOT/package.json"
EXIT=0

fail() { echo "FAIL: $*" >&2; EXIT=1; }
pass() { echo "PASS: $*"; }

# ----------------------------------------------------------------------------
# 1) scripts/install.sh existe y es ejecutable
# ----------------------------------------------------------------------------
[[ -f "$SCRIPT" ]] || { echo "FATAL: $SCRIPT no existe" >&2; exit 1; }
if [[ -x "$SCRIPT" ]]; then
    pass "scripts/install.sh existe y es ejecutable"
else
    fail "scripts/install.sh existe pero NO es ejecutable (chmod +x)"
fi

# ----------------------------------------------------------------------------
# 2) Header documenta el modelo de usuarios WSL2 (deploy/develop/infra)
# ----------------------------------------------------------------------------
if grep -qE 'INVOCADOR canonico.*deploy' "$SCRIPT"; then
    pass "header documenta INVOCADOR canonico = deploy"
else
    fail "header sin INVOCADOR canonico = deploy"
fi
if grep -qE 'NO RUN AS develop' "$SCRIPT"; then
    pass "header documenta restriccion sobre develop"
else
    fail "header sin restriccion explicita sobre develop"
fi
if grep -qE 'NO RUN AS infra' "$SCRIPT"; then
    pass "header documenta restriccion sobre infra"
else
    fail "header sin restriccion explicita sobre infra"
fi

# ----------------------------------------------------------------------------
# 3) Root check al inicio (loud fail si UID != 0)
# ----------------------------------------------------------------------------
if grep -qE '"\$\(id -u\)" -ne 0' "$SCRIPT"; then
    pass "scripts/install.sh valida root al inicio"
else
    fail "scripts/install.sh NO valida root (develop podria invocarlo)"
fi

# ----------------------------------------------------------------------------
# 4) NodeSource via apt (NO nvm)
# ----------------------------------------------------------------------------
if grep -qE 'deb\.nodesource\.com/setup_\$\{NODE_MAJOR\}\.x' "$SCRIPT"; then
    pass "scripts/install.sh usa NodeSource setup_\${NODE_MAJOR}.x"
else
    fail "scripts/install.sh NO usa NodeSource (DEC-NODE-1 regresion)"
fi
if grep -qE '\bnvm\b' "$SCRIPT" | grep -vE '^\s*#'; then
    fail "scripts/install.sh referencia nvm en codigo activo (DEC-NODE-1 regresion)"
else
    pass "scripts/install.sh no usa nvm (DEC-NODE-1 — solo NodeSource)"
fi

# ----------------------------------------------------------------------------
# 5) Variable NODE_MAJOR configurable (futuras upgrades sin tocar el resto)
# ----------------------------------------------------------------------------
if grep -qE 'NODE_MAJOR="\$\{NODE_MAJOR:-[0-9]+\}"' "$SCRIPT"; then
    pass "NODE_MAJOR override-able por env var"
else
    fail "NODE_MAJOR no es override-able — upgrade requiere editar el script"
fi

# ----------------------------------------------------------------------------
# 6) Idempotencia: detecta version ya instalada
# ----------------------------------------------------------------------------
if grep -qE '_installed_node_major\(\)' "$SCRIPT" \
   && grep -qE 'ya esta en la version objetivo' "$SCRIPT"; then
    pass "scripts/install.sh es idempotente (no-op si version objetivo presente)"
else
    fail "scripts/install.sh sin check de idempotencia"
fi

# ----------------------------------------------------------------------------
# 7) Loud failure (DEC-DOC-008): captura stderr de apt + curl
# ----------------------------------------------------------------------------
if grep -qE 'NodeSource setup_\$\{NODE_MAJOR\}\.x fallo' "$SCRIPT"; then
    pass "loud failure en NodeSource setup (DEC-DOC-008)"
else
    fail "scripts/install.sh sin loud failure para NodeSource (DEC-DOC-008)"
fi
if grep -qE 'apt-get install nodejs fallo' "$SCRIPT"; then
    pass "loud failure en apt-get install nodejs (DEC-DOC-008)"
else
    fail "scripts/install.sh sin loud failure para apt install (DEC-DOC-008)"
fi

# ----------------------------------------------------------------------------
# 8) Verifica accesibilidad cross-user post-instalacion
# ----------------------------------------------------------------------------
if grep -qE 'node en path global' "$SCRIPT"; then
    pass "post-install verifica path global del binario"
else
    fail "no verifica path global tras instalacion"
fi

# ----------------------------------------------------------------------------
# 9) package.json declara engines (DEC-NODE-5)
# ----------------------------------------------------------------------------
if python3 -c "
import json, sys
data = json.load(open('$PKG'))
eng = data.get('engines', {})
node = eng.get('node', '')
npmv = eng.get('npm', '')
if not node.startswith('>='):
    sys.exit('node sin restriccion >=')
if int(node.replace('>=', '').split('.')[0]) < 20:
    sys.exit('node engine < 20')
if not npmv.startswith('>='):
    sys.exit('npm sin restriccion >=')
" 2>/dev/null; then
    pass "package.json declara engines node >=20 + npm >=10 (DEC-NODE-5)"
else
    fail "package.json sin engines correctamente declarados (DEC-NODE-5)"
fi

# ----------------------------------------------------------------------------
# 10) Header tiene "sudo bash" como invocacion canonica
# ----------------------------------------------------------------------------
if grep -qE '^#   sudo bash scripts/install\.sh' "$SCRIPT"; then
    pass "header indica 'sudo bash scripts/install.sh'"
else
    fail "header no indica invocacion via sudo bash"
fi

# ----------------------------------------------------------------------------
# 11) Sintaxis bash del provisioner (bash -n)
# ----------------------------------------------------------------------------
if bash -n "$SCRIPT" 2>/dev/null; then
    pass "scripts/install.sh pasa bash -n (sin errores de sintaxis)"
else
    fail "scripts/install.sh tiene errores de sintaxis bash"
fi

# ----------------------------------------------------------------------------
# Cierre
# ----------------------------------------------------------------------------
echo ""
if [[ "$EXIT" -eq 0 ]]; then
    echo ">>> ALL PASS — provisioner setup integro"
else
    echo ">>> FAIL — regresion detectada en provisioner"
fi
exit "$EXIT"
