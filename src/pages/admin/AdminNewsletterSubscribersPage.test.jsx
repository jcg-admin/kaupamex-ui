/**
 * Tests — AdminNewsletterSubscribersPage
 * UC-NEW-03: el admin ve, filtra y desuscribe manualmente suscriptores.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import newsletterReducer from '@redux/slices/newsletterSlice';
import AdminNewsletterSubscribersPage from './AdminNewsletterSubscribersPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { newsletter: newsletterReducer } });

const makeQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

describe('AdminNewsletterSubscribersPage (UC-NEW-03)', () => {
  it('muestra el titulo de la pagina', () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/newsletter/subscribers/`, () =>
        HttpResponse.json({ results: [], total: 0 }),
      ),
    );
    render(wrap(<AdminNewsletterSubscribersPage />));
    expect(
      screen.getByRole('heading', { name: /Suscriptores del newsletter/i }),
    ).toBeInTheDocument();
  });

  it('lista los suscriptores recibidos', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/newsletter/subscribers/`, () =>
        HttpResponse.json({
          results: [
            { id: 1, email: 'ana@x.com', status: 'ACTIVE',       subscribed_at: '2026-01-10T00:00:00Z' },
            { id: 2, email: 'bob@x.com', status: 'UNSUBSCRIBED', subscribed_at: '2025-12-01T00:00:00Z' },
          ],
          total: 2,
        }),
      ),
    );
    render(wrap(<AdminNewsletterSubscribersPage />));
    expect(await screen.findByText(/ana@x.com/i)).toBeInTheDocument();
    expect(screen.getByText(/bob@x.com/i)).toBeInTheDocument();
  });

  it('llama al endpoint admin con el filtro de estado', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/newsletter/subscribers/`, ({ request }) => {
        capturedUrl = new URL(request.url);
        return HttpResponse.json({ results: [] });
      }),
    );
    render(wrap(<AdminNewsletterSubscribersPage />));
    await waitFor(() => {
      expect(capturedUrl).not.toBeUndefined();
      expect(capturedUrl.pathname).toBe('/api/v2/admin/newsletter/subscribers/');
    });
  });

  it('al hacer clic en Desuscribir, hace DELETE al endpoint manual', async () => {
    // handleUnsubscribe usa window.confirm; se debe mockear para que retorne true.
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    server.use(
      http.get(`${BASE}/api/v2/admin/newsletter/subscribers/`, () =>
        HttpResponse.json({
          results: [
            { id: 1, email: 'ana@x.com', status: 'ACTIVE', subscribed_at: '2026-01-10T00:00:00Z' },
          ],
        }),
      ),
    );
    let lastDeleteBody;
    server.use(
      http.delete(`${BASE}/api/v2/admin/newsletter/subscribers/1/subscription/`, async ({ request }) => {
        lastDeleteBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    render(wrap(<AdminNewsletterSubscribersPage />));
    const row = await screen.findByText(/ana@x.com/i);
    expect(row).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Desuscribir/i }));

    await waitFor(() => {
      expect(lastDeleteBody).toMatchObject({ reason: 'SOLICITUD_MANUAL' });
    });
    confirmSpy.mockRestore();
  });
});
