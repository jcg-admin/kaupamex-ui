/**
 * Tests — useInventory / useInventoryMovements
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import { useInventory, useInventoryMovements } from './useInventory';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useInventory hooks', () => {
  it('useInventory devuelve el payload con summary', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ variant_id: 1 }], summary: { agotados: 0 } },
    });
    const { result } = renderHook(() => useInventory({ status: 'BAJO' }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.summary).toEqual({ agotados: 0 });
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/inventory/',
      expect.objectContaining({ params: { status: 'BAJO' } }),
    );
  });

  it('useInventoryMovements(variantId) retorna la lista', async () => {
    apiService.get.mockResolvedValue({ data: { results: [{ id: 1, type: 'SALE' }] } });
    const { result } = renderHook(() => useInventoryMovements(7), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, type: 'SALE' }]);
  });

  it('useInventoryMovements(null) no dispara request', () => {
    renderHook(() => useInventoryMovements(null), { wrapper: makeWrapper() });
    expect(apiService.get).not.toHaveBeenCalled();
  });
});
