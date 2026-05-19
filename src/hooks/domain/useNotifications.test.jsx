/**
 * Tests — useNotifications / useUnreadNotificationsCount / useNotificationPreferences
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import {
  useNotificationsList,
  useUnreadNotificationsCount,
  useNotificationPreferences,
} from './useNotifications';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useNotifications hooks', () => {
  it('useNotificationsList retorna la lista de la API', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 1, subject: 'Bienvenido' }] },
    });
    const { result } = renderHook(() => useNotificationsList(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ id: 1, subject: 'Bienvenido' }]);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/notifications/',
      expect.objectContaining({ params: {} }),
    );
  });

  it('useUnreadNotificationsCount retorna el conteo sin envoltura', async () => {
    apiService.get.mockResolvedValue({ data: { count: 7 } });
    const { result } = renderHook(() => useUnreadNotificationsCount(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBe(7);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/notifications/unread-count/',
      expect.any(Object),
    );
  });

  it('useNotificationPreferences retorna la lista de preferencias', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ type: 'MARKETING', enabled: false }] },
    });
    const { result } = renderHook(() => useNotificationPreferences(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([{ type: 'MARKETING', enabled: false }]);
  });
});
