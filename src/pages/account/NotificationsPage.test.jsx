/**
 * Tests — NotificationsPage
 * UC-NOT-01..05: Bandeja de notificaciones del comprador
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import notificationsReducer from '@redux/slices/notificationsSlice';
import NotificationsPage from './NotificationsPage';

const makeStore = () =>
  configureStore({ reducer: { notifications: notificationsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'ORDER_UPDATE',
    subject: 'Orden confirmada #ORD-001',
    body: 'Tu orden #ORD-001 ha sido recibida.',
    is_read: false,
    created_at: '2026-05-21T10:00:00Z',
  },
  {
    id: 2,
    type: 'RETURN_UPDATE',
    subject: 'Devolución aprobada — #ORD-001',
    body: 'Tu solicitud de devolución fue aprobada.',
    is_read: true,
    created_at: '2026-05-20T08:00:00Z',
  },
];

afterEach(() => jest.clearAllMocks());

describe('NotificationsPage (UC-NOT-01..05)', () => {
  it('muestra el título de la página', async () => {
    apiService.get.mockResolvedValue({ data: { results: NOTIFICATIONS } });
    render(wrap(<NotificationsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Mis notificaciones/i }),
    ).toBeInTheDocument();
  });

  it('muestra la lista de notificaciones', async () => {
    apiService.get.mockResolvedValue({ data: { results: NOTIFICATIONS } });
    render(wrap(<NotificationsPage />, makeStore()));
    expect(await screen.findByText('Orden confirmada #ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Devolución aprobada — #ORD-001')).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay notificaciones', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<NotificationsPage />, makeStore()));
    expect(
      await screen.findByText(/No tienes notificaciones/i),
    ).toBeInTheDocument();
  });

  it('muestra error cuando falla la carga', async () => {
    apiService.get.mockRejectedValue(new Error('Network Error'));
    render(wrap(<NotificationsPage />, makeStore()));
    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/No se pudieron cargar/i);
  });

  it('muestra botón "Marcar todas como leídas" solo si hay no leídas', async () => {
    apiService.get.mockResolvedValue({ data: { results: NOTIFICATIONS } });
    render(wrap(<NotificationsPage />, makeStore()));
    await screen.findByText('Orden confirmada #ORD-001');
    expect(
      screen.getByRole('button', { name: /Marcar todas las notificaciones como leídas/i }),
    ).toBeInTheDocument();
  });

  it('no muestra "Marcar todas" si todas ya están leídas', async () => {
    const allRead = NOTIFICATIONS.map((n) => ({ ...n, is_read: true }));
    apiService.get.mockResolvedValue({ data: { results: allRead } });
    render(wrap(<NotificationsPage />, makeStore()));
    await screen.findByText('Orden confirmada #ORD-001');
    expect(
      screen.queryByRole('button', { name: /Marcar todas las notificaciones como leídas/i }),
    ).not.toBeInTheDocument();
  });

  it('llama al endpoint correcto al marcar como leída', async () => {
    apiService.get.mockResolvedValue({ data: { results: NOTIFICATIONS } });
    apiService.post.mockResolvedValue({ data: {} });
    render(wrap(<NotificationsPage />, makeStore()));
    const btn = await screen.findByRole('button', {
      name: /Marcar notificación "Orden confirmada #ORD-001" como leída/i,
    });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/notifications/1/read/',
      );
    });
  });

  it('llama al endpoint correcto al marcar todas como leídas', async () => {
    apiService.get.mockResolvedValue({ data: { results: NOTIFICATIONS } });
    apiService.post.mockResolvedValue({ data: {} });
    render(wrap(<NotificationsPage />, makeStore()));
    const btn = await screen.findByRole('button', { name: /Marcar todas las notificaciones como leídas/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith('/api/v1/notifications/read-all/');
    });
  });
});
