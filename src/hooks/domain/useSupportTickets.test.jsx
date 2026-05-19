/**
 * Tests — useSupportTickets / useSupportTicket / useAdminSupportTickets
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import {
  useSupportTickets,
  useSupportTicket,
  useAdminSupportTickets,
} from './useSupportTickets';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useSupportTickets hooks', () => {
  it('useSupportTickets retorna la lista', async () => {
    apiService.get.mockResolvedValue({ data: { results: [{ id: 1 }] } });
    const { result } = renderHook(() => useSupportTickets(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('useSupportTicket(id) consulta el detalle', async () => {
    apiService.get.mockResolvedValue({ data: { id: 42, subject: 'x' } });
    const { result } = renderHook(() => useSupportTicket(42), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 42, subject: 'x' });
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/support/tickets/42/',
      expect.objectContaining({ signal: expect.any(Object) }),
    );
  });

  it('useSupportTicket(null) no dispara request', async () => {
    const { result } = renderHook(() => useSupportTicket(null), { wrapper: makeWrapper() });
    // enabled:false -> fetchStatus 'idle'
    expect(apiService.get).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useAdminSupportTickets devuelve el payload tal cual (con metrics)', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], metrics: { open: 3 } } });
    const { result } = renderHook(() => useAdminSupportTickets({ status: 'OPEN' }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.metrics.open).toBe(3);
  });
});
