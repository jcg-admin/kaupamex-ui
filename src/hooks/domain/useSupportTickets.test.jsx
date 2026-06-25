/**
 * Tests — useSupportTickets / useSupportTicket / useAdminSupportTickets
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import {
  useSupportTickets,
  useSupportTicket,
  useAdminSupportTickets,
} from './useSupportTickets';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useSupportTickets hooks', () => {
  it('useSupportTickets retorna la lista', async () => {
    server.use(
      http.get(`${BASE}/api/v2/support/tickets/`, () =>
        HttpResponse.json({ results: [{ id: 1 }] }),
      ),
    );

    const { result } = renderHook(() => useSupportTickets(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1 }]);
  });

  it('useSupportTicket(id) consulta el detalle', async () => {
    server.use(
      http.get(`${BASE}/api/v2/support/tickets/42/`, () =>
        HttpResponse.json({ id: 42, subject: 'x' }),
      ),
    );

    const { result } = renderHook(() => useSupportTicket(42), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ id: 42, subject: 'x' });
  });

  it('useSupportTicket(null) no dispara request', async () => {
    const { result } = renderHook(() => useSupportTicket(null), { wrapper: makeWrapper() });
    // enabled:false -> fetchStatus 'idle'
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('useAdminSupportTickets devuelve el payload tal cual (con metrics)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, () =>
        HttpResponse.json({ results: [], metrics: { open: 3 } }),
      ),
    );

    const { result } = renderHook(() => useAdminSupportTickets({ status: 'OPEN' }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.metrics.open).toBe(3);
  });
});
