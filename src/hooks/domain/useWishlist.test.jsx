/**
 * Tests — useWishlist (UC-WISH-02)
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import { useWishlist } from './useWishlist';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useWishlist (UC-WISH-02)', () => {
  it('devuelve items normalizados con total_items', async () => {
    server.use(
      http.get(`${BASE}/api/v1/wishlist/`, () =>
        HttpResponse.json({
          results: [{ id: 1, product_id: 7 }, { id: 2, product_id: 8 }],
          total_items: 2,
          items_out_of_stock: 1,
        }),
      ),
    );

    const { result } = renderHook(() => useWishlist(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.items).toHaveLength(2);
    expect(result.current.data.total_items).toBe(2);
    expect(result.current.data.items_out_of_stock).toBe(1);
  });

  it('propaga params de filtro disponibilidad', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v1/wishlist/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [] });
      }),
    );

    renderHook(() => useWishlist({ availability: 'IN_STOCK' }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(capturedUrl).toBeDefined());
    await waitFor(() => {
      expect(new URL(capturedUrl).searchParams.get('availability')).toBe('IN_STOCK');
    });
  });
});
