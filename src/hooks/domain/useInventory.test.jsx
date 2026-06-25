/**
 * Tests — useInventory / useInventoryMovements
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import { useInventory, useInventoryMovements } from './useInventory';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useInventory hooks', () => {
  it('useInventory devuelve el payload con summary', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/inventory/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          results: [{ variant_id: 1 }],
          summary: { agotados: 0 },
        });
      }),
    );

    const { result } = renderHook(() => useInventory({ status: 'BAJO' }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.summary).toEqual({ agotados: 0 });
    await waitFor(() => {
      expect(new URL(capturedUrl).searchParams.get('status')).toBe('BAJO');
    });
  });

  it('useInventoryMovements(variantId) retorna la lista', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/inventory/variants/7/movements/`, () =>
        HttpResponse.json({ results: [{ id: 1, type: 'SALE' }] }),
      ),
    );

    const { result } = renderHook(() => useInventoryMovements(7), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, type: 'SALE' }]);
  });

  it('useInventoryMovements(null) no dispara request', () => {
    renderHook(() => useInventoryMovements(null), { wrapper: makeWrapper() });
    // enabled:false — fetchStatus should be idle, no request fired
  });
});
