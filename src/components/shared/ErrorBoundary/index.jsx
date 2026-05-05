/**
 * ErrorBoundary — PracticaYoruba
 * Captura errores de renderizado y muestra un fallback amigable.
 */

import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
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
