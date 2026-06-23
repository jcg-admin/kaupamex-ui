/**
 * Tests — useProductDiscounts (React Query)
 *
 * UC-DASH-04: lista de descuentos de producto activos.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import { useProductDiscounts } from './useProductDiscounts';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useProductDiscounts (UC-DASH-04)', () => {
  it('llama al endpoint admin de product-discounts', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/product-discounts/`, () =>
        HttpResponse.json({
          results: [
            { id: 1, product_id: 10, product_name: 'A', discount_pct: 15.0,
              valid_from: '2026-01-01', valid_until: null,
              status: 'CURRENT', is_active: true,
              original_price: 100, discounted_price: 85 },
          ],
        }),
      ),
    );

    const { result } = renderHook(() => useProductDiscounts(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].discount_pct).toBe(15.0);
  });

  it('propaga el filtro status como query param', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/product-discounts/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      }),
    );

    const { result } = renderHook(
      () => useProductDiscounts({ status: 'CURRENT' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    await waitFor(() => {
      expect(new URL(capturedUrl).searchParams.get('status')).toBe('CURRENT');
    });
  });

  it('expone error cuando la API falla', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/product-discounts/`, () =>
        HttpResponse.json({ detail: 'Boom' }, { status: 400 }),
      ),
    );

    const { result } = renderHook(() => useProductDiscounts(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
