/**
 * Tests — useVouchers (React Query)
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import { useVouchers } from './useVouchers';

const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useVouchers', () => {
  it('devuelve la lista de vouchers desde la API', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 1, code: 'X' }] },
    });

    const { result } = renderHook(() => useVouchers(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, code: 'X' }]);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/vouchers/',
      expect.objectContaining({ params: {} }),
    );
  });

  it('expone error tipado cuando apiService falla', async () => {
    const err = Object.assign(new Error('Boom'), { code: 'INTERNAL_SERVER_ERROR', statusCode: 500 });
    apiService.get.mockRejectedValue(err);

    const { result } = renderHook(() => useVouchers(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error.message).toBe('Boom');
  });
});
