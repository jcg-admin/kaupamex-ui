/**
 * Tests — useNotifications / useUnreadNotificationsCount / useNotificationPreferences
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import {
  useNotificationsList,
  useUnreadNotificationsCount,
  useNotificationPreferences,
} from './useNotifications';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

describe('useNotifications hooks', () => {
  it('useNotificationsList retorna la forma paginada de la API', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({
          results: [{ id: 1, subject: 'Bienvenido' }],
          count: 1,
          next: null,
          previous: null,
        }),
      ),
    );

    const { result } = renderHook(() => useNotificationsList(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    // H-CICLO88-02: el hook devuelve el objeto paginado completo { results, count, next, previous }
    expect(result.current.data).toEqual({
      results: [{ id: 1, subject: 'Bienvenido' }],
      count: 1,
      next: null,
      previous: null,
    });
  });

  it('useUnreadNotificationsCount retorna el conteo sin envoltura', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/unread-count/`, () =>
        HttpResponse.json({ count: 7 }),
      ),
    );

    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(7);
  });

  it('useNotificationPreferences retorna la lista de preferencias', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/preferences/`, () =>
        HttpResponse.json({ results: [{ type: 'MARKETING', enabled: false }] }),
      ),
    );

    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ type: 'MARKETING', enabled: false }]);
  });
});
