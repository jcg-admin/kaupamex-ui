/**
 * Tests — useReturns / useReturn / useAdminReturns
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import { useReturns, useReturn, useAdminReturns } from './useReturns';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useReturns hooks', () => {
  it('useReturns retorna la lista', async () => {
    apiService.get.mockResolvedValue({ data: { results: [{ id: 7 }] } });
    const { result } = renderHook(() => useReturns(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 7 }]);
  });

  it('useReturn(id) carga el detalle', async () => {
    apiService.get.mockResolvedValue({ data: { id: 7, status: 'PENDIENTE' } });
    const { result } = renderHook(() => useReturn(7), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.status).toBe('PENDIENTE');
  });

  it('useAdminReturns con filtro de estado', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [], metrics: { pendientes: 3 } },
    });
    const { result } = renderHook(
      () => useAdminReturns({ status: 'PENDIENTE' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.metrics.pendientes).toBe(3);
  });
});
