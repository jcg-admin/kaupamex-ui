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
 * TDD estricto: mock de apiService, timers falsos para el debounce.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import useSearchSuggestions, { SUGGESTIONS_KEY, SUGGESTIONS_URL } from './useSearchSuggestions';

const makeWrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
};

beforeEach(() => {
  jest.useFakeTimers();
  apiService.get.mockReset();
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
    renderHook(() => useSearchSuggestions('a'), { wrapper: makeWrapper() });
    act(() => { jest.advanceTimersByTime(500); });
    expect(apiService.get).not.toHaveBeenCalled();
  });

  it('consulta GET /api/v2/catalogue/autocomplete/ tras el debounce', async () => {
    apiService.get.mockResolvedValue({
      data: [{ id: 1, name: 'Collar Oshun', slug: 'collar-oshun' }],
    });

    const { result } = renderHook(() => useSearchSuggestions('col'), {
      wrapper: makeWrapper(),
    });

    // Antes del debounce no hay llamada.
    expect(apiService.get).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(250); });

    await waitFor(() => expect(apiService.get).toHaveBeenCalled());

    expect(apiService.get).toHaveBeenCalledWith(
      SUGGESTIONS_URL,
      expect.objectContaining({ params: expect.objectContaining({ q: 'col' }) }),
    );

    await waitFor(() =>
      expect(result.current.suggestions).toEqual(['Collar Oshun']),
    );
  });

  it('aplica debounce: cambios rapidos solo consultan con el ultimo termino', async () => {
    apiService.get.mockResolvedValue({ data: [] });

    const { rerender } = renderHook(({ q }) => useSearchSuggestions(q), {
      wrapper: makeWrapper(),
      initialProps: { q: 'co' },
    });

    rerender({ q: 'col' });
    rerender({ q: 'coll' });

    act(() => { jest.advanceTimersByTime(250); });

    await waitFor(() => expect(apiService.get).toHaveBeenCalledTimes(1));
    expect(apiService.get).toHaveBeenCalledWith(
      SUGGESTIONS_URL,
      expect.objectContaining({ params: expect.objectContaining({ q: 'coll' }) }),
    );
  });

  it('mapea respuesta paginada {results:[...]} a nombres', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 2, name: 'Pulsera Yemaya', slug: 'pulsera-yemaya' }] },
    });

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
