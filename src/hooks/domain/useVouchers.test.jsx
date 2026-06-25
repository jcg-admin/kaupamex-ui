/**
 * Tests — useVouchers (React Query)
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import { useVouchers } from './useVouchers';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useVouchers', () => {
  it('devuelve la lista de vouchers desde la API', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: [{ id: 1, code: 'X' }] }),
      ),
    );

    const { result } = renderHook(() => useVouchers(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.results).toEqual([{ id: 1, code: 'X' }]);
  });

  it('expone error tipado cuando apiService falla', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ detail: 'Boom' }, { status: 400 }),
      ),
    );

    const { result } = renderHook(() => useVouchers(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
