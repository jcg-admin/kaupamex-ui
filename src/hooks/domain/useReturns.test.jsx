/**
 * Tests — useReturns / useReturn / useAdminReturns
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import { useReturns, useReturn, useAdminReturns } from './useReturns';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useReturns hooks', () => {
  it('useReturns retorna la lista', async () => {
    server.use(
      http.get(`${BASE}/api/v1/returns/`, () =>
        HttpResponse.json({ results: [{ id: 7 }] }),
      ),
    );

    const { result } = renderHook(() => useReturns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 7 }]);
  });

  it('useReturn(id) carga el detalle', async () => {
    server.use(
      http.get(`${BASE}/api/v1/returns/7/`, () =>
        HttpResponse.json({ id: 7, status: 'PENDING_REVIEW' }),
      ),
    );

    const { result } = renderHook(() => useReturn(7), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.status).toBe('PENDING_REVIEW');
  });

  it('useAdminReturns con filtro de estado', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () =>
        HttpResponse.json({ results: [], metrics: { pendientes: 3 } }),
      ),
    );

    const { result } = renderHook(
      () => useAdminReturns({ status: 'PENDING_REVIEW' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.metrics.pendientes).toBe(3);
  });
});
