/**
 * ErrorBoundary — Kaupamex
 * Captura errores de renderizado y muestra un fallback amigable.
 */

import { Component } from 'react';

import { logError } from '@utils/errorLog';

/**
 * H-WL-02: detecta el fallo de carga de un chunk lazy (JS o CSS). Ocurre cuando
 * el navegador tiene cacheado un index.html/bundle viejo que referencia un hash
 * de chunk que un redeploy ya reemplazó → 404 "Loading chunk failed".
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const name = error.name || '';
  const msg = error.message || '';
  return name === 'ChunkLoadError' || /Loading (CSS )?chunk [\w-]+ failed/i.test(msg);
}

const CHUNK_RELOAD_KEY = 'py:chunk-reloaded-at';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // H-WL-02: si es un fallo de chunk (hash viejo tras redeploy), recargar una
    // vez trae el index.html nuevo con las referencias correctas. Guard por
    // sessionStorage para no entrar en bucle si el chunk realmente no está.
    if (isChunkLoadError(error)) {
      try {
        const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
        if (Date.now() - last > 10000) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
          window.location.reload();
          return;
        }
      } catch { /* sessionStorage no disponible: cae al fallback normal */ }
    }
    // Registrar en el log de errores del cliente (consola + buffer).
    logError({
      type: 'render/error-boundary',
      message: error?.message ?? 'Error de renderizado',
      detail: { stack: info?.componentStack },
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const FallbackComponent = this.props.fallback;
    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '50vh', padding: '32px',
        textAlign: 'center',
      }}>
        <h2 style={{ color: '#3D1F0D', marginBottom: 12, fontFamily: 'Georgia, serif' }}>
          Algo salió mal
        </h2>
        <p style={{ color: '#5C4A3A', marginBottom: 24, maxWidth: 440 }}>
          {this.state.error?.message || 'Ha ocurrido un error inesperado.'}
        </p>
        <button
          onClick={this.handleReset}
          style={{
            padding: '10px 20px', background: '#B8860B', color: '#fff',
            border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          }}
        >
          Reintentar
        </button>
      </div>
    );
  }
}
