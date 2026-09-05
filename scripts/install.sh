#!/bin/bash
# =============================================================================
# scripts/install.sh — provisioner de Node.js + npm para Kaupamex-ui
# =============================================================================
# IDEMPOTENTE: si la version objetivo de Node ya esta instalada, no-op.
#
# Instala Node.js LTS via el repositorio oficial de NodeSource configurado
# como apt source. Los binarios quedan en /usr/bin/node y /usr/bin/npm —
# owned por root, world-readable y executable. Disponible para cualquier
# usuario del sistema sin permisos especiales.
#
# Uso:
#   sudo bash scripts/install.sh
#
# Modelo de usuarios (ver Procedimiento-Implementacion-Almacenamiento-
# WSL2-ecomerce-p001 v1.0.0 si aplica):
#   - INVOCADOR canonico: 'deploy' (sudo general).
#   - NO RUN AS develop: develop no tiene sudo; apt-get y curl|bash
#     fallarian con permission denied.
#   - NO RUN AS infra: 'bash' no esta en su whitelist NOPASSWD,
#     'sudo bash install.sh' como infra falla.
#
# Tras la instalacion, develop puede:
#   npm install
#   npm test
#   npm run dev
#
# Por que NodeSource y no nvm:
#   nvm instala bajo /home/<user>/.nvm/ — no se comparte cross-user.
#   develop en WSL2 no tiene permisos para leer /home/deploy/.nvm/.
#   Symlinks a /usr/local/bin/ no resuelven el problema de permisos
#   en el target. NodeSource via apt es la unica opcion que provee
#   instalacion global y version LTS moderna.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Version objetivo. Cambiar este valor cuando se decida upgrade.
# NodeSource publica setup_<major>.x scripts para cada major (18, 20, 22, 24).
NODE_MAJOR="${NODE_MAJOR:-22}"

# -----------------------------------------------------------------------------
# Logging minimal — autocontenido para no depender de utils externos.
# -----------------------------------------------------------------------------
if [[ -t 1 ]]; then
    _CLR_RESET="\033[0m"; _CLR_GREEN="\033[0;32m"; _CLR_YELLOW="\033[0;33m"
    _CLR_RED="\033[0;31m"; _CLR_CYAN="\033[0;36m"
else
    _CLR_RESET=""; _CLR_GREEN=""; _CLR_YELLOW=""; _CLR_RED=""; _CLR_CYAN=""
fi
log_info()    { echo -e "${_CLR_CYAN}[INFO]${_CLR_RESET} $*"; }
log_success() { echo -e "${_CLR_GREEN}[OK]${_CLR_RESET}   $*"; }
log_warn()    { echo -e "${_CLR_YELLOW}[WARN]${_CLR_RESET} $*"; }
log_error()   { echo -e "${_CLR_RED}[ERR]${_CLR_RESET}  $*" >&2; }
log_fatal()   { echo -e "${_CLR_RED}[FATAL]${_CLR_RESET} $*" >&2; }

# -----------------------------------------------------------------------------
# PASO 1: validar root
# -----------------------------------------------------------------------------
_check_root() {
    if [[ "$(id -u)" -ne 0 ]]; then
        log_fatal "install.sh debe ejecutarse como root (via sudo)"
        log_error ""
        log_error "  Estas corriendo como: $(whoami) (UID $(id -u))"
        log_error "  Usa: sudo bash scripts/install.sh"
        log_error ""
        log_error "  Modelo de usuarios WSL2:"
        log_error "    deploy   — cuenta sudoer que invoca este script"
        log_error "    develop  — owner del repo; SIN sudo, NO ejecuta el provisioner"
        log_error "    infra    — 'bash' NO esta en su whitelist NOPASSWD"
        exit 1
    fi
}

# -----------------------------------------------------------------------------
# PASO 2: verificar requisitos (Ubuntu + apt + curl)
# -----------------------------------------------------------------------------
_check_requisites() {
    log_info "Verificando requisitos..."

    if ! command -v apt-get >/dev/null 2>&1; then
        log_fatal "Este script requiere apt-get (Ubuntu/Debian)"
        exit 1
    fi
    log_success "apt-get disponible"

    if ! command -v curl >/dev/null 2>&1; then
        log_info "  curl no presente — instalandolo (lo necesita NodeSource)"
        local _log
        _log=$(mktemp)
        if ! DEBIAN_FRONTEND=noninteractive apt-get install -y curl > "$_log" 2>&1; then
            log_fatal "No se pudo instalar curl"
            sed 's/^/    /' "$_log" >&2
            rm -f "$_log"
            exit 1
        fi
        rm -f "$_log"
    fi
    log_success "curl disponible"
}

# -----------------------------------------------------------------------------
# Helper: detectar version major de Node instalado (vacio si no hay)
# -----------------------------------------------------------------------------
_installed_node_major() {
    if ! command -v node >/dev/null 2>&1; then
        echo ""
        return
    fi
    # node --version → 'v22.11.0' → '22'
    node --version 2>/dev/null \
        | sed -E 's/^v([0-9]+)\..*/\1/' \
        || echo ""
}

# -----------------------------------------------------------------------------
# PASO 3: instalar Node (idempotente)
# -----------------------------------------------------------------------------
_install_node() {
    local current
    current=$(_installed_node_major)

    if [[ "$current" == "$NODE_MAJOR" ]]; then
        log_success "Node $(node --version) ya esta en la version objetivo (${NODE_MAJOR}.x) — no-op"
        log_info "  npm: $(npm --version)"
        return 0
    fi

    if [[ -n "$current" ]]; then
        log_warn "Node ${current}.x instalado — distinto del objetivo (${NODE_MAJOR}.x)"
        log_warn "  Procediendo con upgrade via NodeSource (no purga datos del proyecto)"
    else
        log_info "Node no instalado — instalando ${NODE_MAJOR}.x desde NodeSource"
    fi

    # NodeSource setup script — configura apt source + GPG key + apt update.
    # DEC-DOC-008 loud failure: capturar output a tempfile, emitir si falla.
    local _setup_log
    _setup_log=$(mktemp)
    log_info "  Configurando repositorio NodeSource (setup_${NODE_MAJOR}.x)..."
    if ! curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" \
            | bash -E - > "$_setup_log" 2>&1; then
        log_fatal "NodeSource setup_${NODE_MAJOR}.x fallo"
        log_error "Output:"
        sed 's/^/    /' "$_setup_log" >&2
        rm -f "$_setup_log"
        log_error ""
        log_error "Posibles causas:"
        log_error "  - Sin acceso a deb.nodesource.com:443"
        log_error "  - NodeSource cambio de URL para esta major version"
        log_error "  - apt-get update fallo dentro del setup"
        exit 1
    fi
    rm -f "$_setup_log"
    log_success "Repositorio NodeSource configurado"

    # Instalar nodejs (NodeSource empaqueta node + npm en un solo paquete)
    local _install_log
    _install_log=$(mktemp)
    log_info "  Instalando nodejs..."
    if ! DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs \
            > "$_install_log" 2>&1; then
        log_fatal "apt-get install nodejs fallo"
        sed 's/^/    /' "$_install_log" >&2
        rm -f "$_install_log"
        exit 1
    fi
    rm -f "$_install_log"

    log_success "Node $(node --version) instalado en /usr/bin/node"
    log_info "  npm: $(npm --version)"
}

# -----------------------------------------------------------------------------
# PASO 4: verificar accesibilidad cross-user
# -----------------------------------------------------------------------------
_verify_installation() {
    log_info "Verificando que los binarios sean accesibles..."

    local node_bin npm_bin
    node_bin=$(command -v node)
    npm_bin=$(command -v npm)

    if [[ -z "$node_bin" ]] || [[ -z "$npm_bin" ]]; then
        log_fatal "node o npm no estan en PATH tras la instalacion"
        exit 1
    fi

    # Confirmar que viven en /usr/bin (instalacion global, NO en /home/X/.nvm)
    case "$node_bin" in
        /usr/bin/*|/usr/local/bin/*)
            log_success "node en path global: ${node_bin}"
            ;;
        *)
            log_warn "node en path no global: ${node_bin}"
            log_warn "  Otros usuarios (develop) podrian no tener acceso"
            ;;
    esac

    # Verificar permisos: world-readable + world-executable
    local perms
    perms=$(stat -c '%a' "$node_bin" 2>/dev/null || echo "???")
    case "$perms" in
        755|775|0755|0775)
            log_success "Permisos de node = ${perms} (accesible para todos los usuarios)"
            ;;
        *)
            log_warn "Permisos de node = ${perms} (posiblemente restrictivo)"
            ;;
    esac

    log_success "node $(node --version) + npm $(npm --version) listos"
}

# =============================================================================
# MAIN
# =============================================================================
echo ""
echo -e "${_CLR_CYAN}===============================================================${_CLR_RESET}"
echo -e "${_CLR_CYAN}  Node.js provisioner — Kaupamex-ui${_CLR_RESET}"
echo -e "${_CLR_CYAN}===============================================================${_CLR_RESET}"
echo "  Target major : ${NODE_MAJOR}.x (variable NODE_MAJOR)"
echo "  Repo source  : NodeSource (deb.nodesource.com)"
echo "  Install path : /usr/bin/node, /usr/bin/npm"
echo ""

_check_root
_check_requisites
_install_node
_verify_installation

echo ""
echo -e "${_CLR_GREEN}===============================================================${_CLR_RESET}"
log_success "Provisioner completado."
echo ""
log_info "Siguiente (como develop):"
log_info "  cd ${PROJECT_ROOT}"
log_info "  npm install"
log_info "  npm test"
log_info "  npm run dev"
