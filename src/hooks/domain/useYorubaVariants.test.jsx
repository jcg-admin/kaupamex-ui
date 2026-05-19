/**
 * Tests — useAdminProductVariants (Yoruba CHT-03)
 * Patron canonico React Query + apiService mock.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import {
  useAdminProductVariants,
  YORUBA_VARIANTS_KEY,
} from './useYorubaVariants';

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useAdminProductVariants', () => {
  it('expone la clave canonica de cache', () => {
    expect(YORUBA_VARIANTS_KEY).toEqual(['yoruba-variants']);
  });

  it('lista las variantes admin del producto indicado', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 1, option_name: 'Grande' }] },
    });
    const { result } = renderHook(() => useAdminProductVariants(42), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, option_name: 'Grande' }]);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/products/42/variants/',
      expect.objectContaining({ signal: expect.anything() }),
    );
  });

  it('queda deshabilitado si no hay productId', () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    renderHook(() => useAdminProductVariants(undefined), {
      wrapper: makeWrapper(),
    });
    expect(apiService.get).not.toHaveBeenCalled();
  });

  it('acepta payload plano (array sin envoltura results)', async () => {
    apiService.get.mockResolvedValue({
      data: [{ id: 2, option_name: 'Mediana' }],
    });
    const { result } = renderHook(() => useAdminProductVariants(42), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 2, option_name: 'Mediana' }]);
  });
});
