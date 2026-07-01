/**
 * ErrorBoundary — detección de chunk-load error + auto-reload (H-WL-02).
 */
import { render, screen } from '@testing-library/react';
import ErrorBoundary, { isChunkLoadError } from './index';

function Boom({ error }) { throw error; }

describe('isChunkLoadError', () => {
  it('detecta ChunkLoadError por name', () => {
    const e = new Error('whatever'); e.name = 'ChunkLoadError';
    expect(isChunkLoadError(e)).toBe(true);
  });
  it('detecta "Loading chunk N failed" y "Loading CSS chunk N failed"', () => {
    expect(isChunkLoadError(new Error('Loading chunk 6742 failed.'))).toBe(true);
    expect(isChunkLoadError(new Error('Loading CSS chunk 6742 failed. (error: ...)'))).toBe(true);
  });
  it('no marca errores normales', () => {
    expect(isChunkLoadError(new Error('boom'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });
});

// jsdom no permite mockear window.location.reload (read-only, no-op). Se asserta
// sobre el efecto observable: el guard en sessionStorage (py:chunk-reloaded-at).
describe('ErrorBoundary — auto-reload en chunk error', () => {
  const KEY = 'py:chunk-reloaded-at';
  beforeEach(() => {
    sessionStorage.clear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => { console.error.mockRestore?.(); });

  it('ante un ChunkLoadError marca el guard de recarga', () => {
    const err = new Error('Loading CSS chunk 6742 failed.'); err.name = 'ChunkLoadError';
    render(<ErrorBoundary><Boom error={err} /></ErrorBoundary>);
    expect(sessionStorage.getItem(KEY)).toBeTruthy();
  });

  it('no recarga en bucle: con el guard reciente, muestra el fallback', () => {
    sessionStorage.setItem(KEY, String(Date.now()));
    const err = new Error('Loading chunk 6742 failed.'); err.name = 'ChunkLoadError';
    render(<ErrorBoundary><Boom error={err} /></ErrorBoundary>);
    expect(screen.getByText(/Algo salió mal/i)).toBeInTheDocument();
  });

  it('un error normal muestra el fallback y NO marca el guard', () => {
    render(<ErrorBoundary><Boom error={new Error('boom')} /></ErrorBoundary>);
    expect(screen.getByText(/Algo salió mal/i)).toBeInTheDocument();
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });
});
