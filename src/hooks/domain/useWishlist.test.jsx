/**
 * Tests — useWishlist (UC-WISH-02)
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import { useWishlist } from './useWishlist';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useWishlist (UC-WISH-02)', () => {
  it('devuelve items normalizados con total_items', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [{ id: 1, product_id: 7 }, { id: 2, product_id: 8 }],
        total_items: 2,
        items_out_of_stock: 1,
      },
    });
    const { result } = renderHook(() => useWishlist(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.items).toHaveLength(2);
    expect(result.current.data.total_items).toBe(2);
    expect(result.current.data.items_out_of_stock).toBe(1);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/wishlist/',
      expect.objectContaining({ params: {} }),
    );
  });

  it('propaga params de filtro disponibilidad', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    renderHook(() => useWishlist({ availability: 'IN_STOCK' }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(apiService.get).toHaveBeenCalled());
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/wishlist/',
      expect.objectContaining({ params: { availability: 'IN_STOCK' } }),
    );
  });
});
