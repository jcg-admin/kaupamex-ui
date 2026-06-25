/**
 * Tests — useSearchSuggestions (UC-SRCH-02).
 *
 * Autocomplete con sugerencias en vivo. El hook:
 *   - aplica debounce (~250ms) al termino antes de consultar,
 *   - exige minimo 2 caracteres (query deshabilitada por debajo),
 *   - llama GET /api/v2/catalogue/autocomplete/?q=,
 *   - mapea el array de productos {id,name,slug} a sus nombres,
 *   - expone { suggestions, isLoading }.
 *
 * TDD estricto: MSW v2, timers falsos para el debounce.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import useSearchSuggestions, { SUGGESTIONS_KEY, SUGGESTIONS_URL } from './useSearchSuggestions';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe('useSearchSuggestions (UC-SRCH-02)', () => {
  it('expone forma { suggestions, isLoading } con valores iniciales', () => {
    const { result } = renderHook(() => useSearchSuggestions(''), {
      wrapper: makeWrapper(),
    });
    expect(Array.isArray(result.current.suggestions)).toBe(true);
    expect(result.current.suggestions).toHaveLength(0);
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('NO consulta con menos de 2 caracteres', () => {
    let requestMade = false;
    server.use(
      http.get(`${BASE}/api/v1/catalogue/autocomplete/`, () => {
        requestMade = true;
        return HttpResponse.json([]);
      }),
    );

    renderHook(() => useSearchSuggestions('a'), { wrapper: makeWrapper() });
    act(() => { jest.advanceTimersByTime(500); });
    expect(requestMade).toBe(false);
  });

  it('consulta GET /api/v1/catalogue/autocomplete/ tras el debounce', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v1/catalogue/autocomplete/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json([{ id: 1, name: 'Collar Oshun', slug: 'collar-oshun' }]);
      }),
    );

    const { result } = renderHook(() => useSearchSuggestions('col'), {
      wrapper: makeWrapper(),
    });

    // Antes del debounce no hay llamada.
    expect(capturedUrl).toBeUndefined();

    act(() => { jest.advanceTimersByTime(250); });

    await waitFor(() => expect(capturedUrl).toBeDefined());

    await waitFor(() => {
      expect(new URL(capturedUrl).searchParams.get('q')).toBe('col');
    });

    await waitFor(() =>
      expect(result.current.suggestions).toEqual(['Collar Oshun']),
    );
  });

  it('aplica debounce: cambios rapidos solo consultan con el ultimo termino', async () => {
    let requestCount = 0;
    let lastCapturedUrl;
    server.use(
      http.get(`${BASE}/api/v1/catalogue/autocomplete/`, ({ request }) => {
        requestCount++;
        lastCapturedUrl = request.url;
        return HttpResponse.json([]);
      }),
    );

    const { rerender } = renderHook(({ q }) => useSearchSuggestions(q), {
      wrapper: makeWrapper(),
      initialProps: { q: 'co' },
    });

    rerender({ q: 'col' });
    rerender({ q: 'coll' });

    act(() => { jest.advanceTimersByTime(250); });

    await waitFor(() => expect(requestCount).toBeGreaterThanOrEqual(1));
    // Only 1 request should have been made (last debounced term)
    expect(requestCount).toBe(1);
    await waitFor(() => {
      expect(new URL(lastCapturedUrl).searchParams.get('q')).toBe('coll');
    });
  });

  it('mapea respuesta paginada {results:[...]} a nombres', async () => {
    server.use(
      http.get(`${BASE}/api/v1/catalogue/autocomplete/`, () =>
        HttpResponse.json({ results: [{ id: 2, name: 'Pulsera Yemaya', slug: 'pulsera-yemaya' }] }),
      ),
    );

    const { result } = renderHook(() => useSearchSuggestions('pul'), {
      wrapper: makeWrapper(),
    });

    act(() => { jest.advanceTimersByTime(250); });

    await waitFor(() =>
      expect(result.current.suggestions).toEqual(['Pulsera Yemaya']),
    );
  });

  it('expone una key de query estable', () => {
    expect(Array.isArray(SUGGESTIONS_KEY)).toBe(true);
  });
});
