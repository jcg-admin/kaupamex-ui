/**
 * Tests — NotificationsPage
 * UC-NOT-01..05: Bandeja de notificaciones del comprador
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import notificationsReducer from '@redux/slices/notificationsSlice';
import NotificationsPage from './NotificationsPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

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

describe('NotificationsPage (UC-NOT-01..05)', () => {
  it('muestra el título de la página', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ results: NOTIFICATIONS }),
      ),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Mis notificaciones/i }),
    ).toBeInTheDocument();
  });

  it('muestra la lista de notificaciones', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ results: NOTIFICATIONS }),
      ),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    expect(await screen.findByText('Orden confirmada #ORD-001')).toBeInTheDocument();
    expect(screen.getByText('Devolución aprobada — #ORD-001')).toBeInTheDocument();
  });

  it('muestra mensaje vacío cuando no hay notificaciones', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ results: [] }),
      ),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    expect(
      await screen.findByText(/No tienes notificaciones/i),
    ).toBeInTheDocument();
  });

  it('muestra error cuando falla la carga', async () => {
    // Use 400 (not 500/503) to avoid apiService retry delays (RETRYABLE_STATUS).
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ detail: 'Network Error' }, { status: 400 }),
      ),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    expect(
      await screen.findByRole('alert'),
    ).toHaveTextContent(/No se pudieron cargar/i);
  });

  it('muestra botón "Marcar todas como leídas" solo si hay no leídas', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ results: NOTIFICATIONS }),
      ),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    await screen.findByText('Orden confirmada #ORD-001');
    expect(
      screen.getByRole('button', { name: /Marcar todas las notificaciones como leídas/i }),
    ).toBeInTheDocument();
  });

  it('no muestra "Marcar todas" si todas ya están leídas', async () => {
    const allRead = NOTIFICATIONS.map((n) => ({ ...n, is_read: true }));
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ results: allRead }),
      ),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    await screen.findByText('Orden confirmada #ORD-001');
    expect(
      screen.queryByRole('button', { name: /Marcar todas las notificaciones como leídas/i }),
    ).not.toBeInTheDocument();
  });

  it('llama al endpoint correcto al marcar como leída', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ results: NOTIFICATIONS }),
      ),
    );
    let lastBody;
    server.use(
      http.patch(`${BASE}/api/v2/notifications/1/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({});
      }),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    const btn = await screen.findByRole('button', {
      name: /Marcar notificación "Orden confirmada #ORD-001" como leída/i,
    });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(lastBody).toMatchObject({});
    });
  });

  it('llama al endpoint correcto al marcar todas como leídas', async () => {
    server.use(
      http.get(`${BASE}/api/v2/notifications/`, () =>
        HttpResponse.json({ results: NOTIFICATIONS }),
      ),
    );
    let readAllCalled = false;
    server.use(
      http.patch(`${BASE}/api/v2/notifications/`, async ({ request }) => {
        await request.json();
        readAllCalled = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<NotificationsPage />, makeStore()));
    const btn = await screen.findByRole('button', { name: /Marcar todas las notificaciones como leídas/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(readAllCalled).toBe(true);
    });
  });
});
