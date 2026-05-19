/**
 * Tests — useProductDiscounts (React Query)
 *
 * UC-DASH-04: lista de descuentos de producto activos.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import { useProductDiscounts } from './useProductDiscounts';

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useProductDiscounts (UC-DASH-04)', () => {
  it('llama al endpoint admin de product-discounts', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [
          { id: 1, product_id: 10, product_name: 'A', discount_pct: 15.0,
            valid_from: '2026-01-01', valid_until: null,
            status: 'CURRENT', is_active: true,
            original_price: 100, discounted_price: 85 },
        ],
      },
    });

    const { result } = renderHook(() => useProductDiscounts(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/product-discounts/',
      expect.objectContaining({ params: {} }),
    );
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].discount_pct).toBe(15.0);
  });

  it('propaga el filtro status como query param', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    const { result } = renderHook(
      () => useProductDiscounts({ status: 'CURRENT' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/product-discounts/',
      expect.objectContaining({ params: { status: 'CURRENT' } }),
    );
  });

  it('expone error cuando la API falla', async () => {
    apiService.get.mockRejectedValue(
      Object.assign(new Error('Boom'), { code: 'INTERNAL_SERVER_ERROR' }),
    );
    const { result } = renderHook(() => useProductDiscounts(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toBe('Boom');
  });
});
