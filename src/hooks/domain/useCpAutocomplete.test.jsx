/**
 * Tests — useCpAutocomplete (T-214, party migration).
 *
 * Autocompletado de C.P. mexicano. El hook:
 *   - aplica debounce (~300ms) al C.P. antes de consultar,
 *   - exige EXACTAMENTE 5 digitos (query deshabilitada por debajo/encima),
 *   - llama GET /api/v2/geo/postal-codes/<cp>/?country=MX,
 *   - degrada con gracia un 404 (CP_NO_ENCONTRADO): notFound=true, data=null,
 *     error=null (nunca bloquea al consumidor),
 *   - expone { loading, error, notFound, data }.
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import useCpAutocomplete, { CP_LOOKUP_KEY, normalizeCp } from './useCpAutocomplete';

const BASE = process.env.API_URL || 'http://localhost:8000';

const LOOKUP_BODY = {
  postal_code: '01000',
  country: 'MX',
  state: 'Ciudad de México',
  municipality: 'Álvaro Obregón',
  city: 'Ciudad de México',
  settlements: [
    { settlement_name: 'Los Alpes', settlement_type: 'Colonia' },
    { settlement_name: 'San José Insurgentes', settlement_type: 'Colonia' },
  ],
};

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

describe('useCpAutocomplete (T-214)', () => {
  it('expone forma { loading, error, notFound, data } con valores iniciales', () => {
    const { result } = renderHook(() => useCpAutocomplete(''), {
      wrapper: makeWrapper(),
    });
    expect(result.current.data).toBeNull();
    expect(result.current.notFound).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.loading).toBe('boolean');
  });

  it('NO consulta con menos de 5 digitos', () => {
    let requestMade = false;
    server.use(
      http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, () => {
        requestMade = true;
        return HttpResponse.json(LOOKUP_BODY);
      }),
    );
    renderHook(() => useCpAutocomplete('0100'), { wrapper: makeWrapper() });
    act(() => { jest.advanceTimersByTime(500); });
    expect(requestMade).toBe(false);
  });

  it('descarta no-digitos y trunca a 5 (normalizeCp)', () => {
    expect(normalizeCp('01-000 extra')).toBe('01000');
    expect(normalizeCp(undefined)).toBe('');
  });

  it('consulta GET /api/v2/geo/postal-codes/<cp>/ tras el debounce (5 digitos)', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, ({ request, params }) => {
        capturedUrl = request.url;
        expect(params.cp).toBe('01000');
        return HttpResponse.json(LOOKUP_BODY);
      }),
    );

    const { result } = renderHook(() => useCpAutocomplete('01000'), {
      wrapper: makeWrapper(),
    });

    expect(capturedUrl).toBeUndefined();
    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => expect(capturedUrl).toBeDefined());
    expect(new URL(capturedUrl).searchParams.get('country')).toBe('MX');

    await waitFor(() => expect(result.current.data).toEqual(LOOKUP_BODY));
    expect(result.current.notFound).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('un 404 (CP_NO_ENCONTRADO) degrada a notFound=true sin exponer error', async () => {
    server.use(
      http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, () =>
        HttpResponse.json({ codigo_error: 'CP_NO_ENCONTRADO', detail: 'No existe' }, { status: 404 }), // canon-idioma: codigo_error real del api (contrato externo)
      ),
    );

    const { result } = renderHook(() => useCpAutocomplete('99999'), {
      wrapper: makeWrapper(),
    });

    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => expect(result.current.notFound).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('aplica debounce: cambios rapidos solo consultan el ultimo C.P.', async () => {
    let requestCount = 0;
    server.use(
      http.get(`${BASE}/api/v2/geo/postal-codes/:cp/`, ({ params }) => {
        requestCount++;
        expect(params.cp).toBe('01010');
        return HttpResponse.json(LOOKUP_BODY);
      }),
    );

    const { rerender } = renderHook(({ cp }) => useCpAutocomplete(cp), {
      wrapper: makeWrapper(),
      initialProps: { cp: '01000' },
    });

    rerender({ cp: '01001' });
    rerender({ cp: '01010' });

    act(() => { jest.advanceTimersByTime(300); });

    await waitFor(() => expect(requestCount).toBe(1));
  });

  it('expone una key de query estable', () => {
    expect(Array.isArray(CP_LOOKUP_KEY)).toBe(true);
  });
});
