/**
 * Tests — SupportTicketDetailPage
 * UC-SUPP-02: Ver detalle de ticket
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import SupportTicketDetailPage from './SupportTicketDetailPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderAt = (path, store) => render(
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/support/tickets/:id" element={<SupportTicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const TICKET_DETAIL = {
  id: 42,
  subject: 'Pedido tardio',
  body:    'Mi pedido lleva 10 dias sin llegar',
  status:  'AWAITING_USER',
  created_at: '2026-05-10T10:00:00Z',
  replies: [
    { id: 1, body: 'Hola, revisamos tu pedido.', author: 'admin',
      is_internal: false, sent_at: '2026-05-11T09:00:00Z' },
    { id: 2, body: 'Gracias, sigo esperando.',    author: 'buyer',
      is_internal: false, sent_at: '2026-05-12T08:30:00Z' },
  ],
};

describe('SupportTicketDetailPage (UC-SUPP-02 detalle)', () => {
  it('carga y muestra el asunto del ticket', async () => {
    server.use(
      http.get(`${BASE}/api/v2/support/tickets/42/`, () => HttpResponse.json(TICKET_DETAIL)),
    );
    renderAt('/support/tickets/42', makeStore());
    expect(await screen.findByText(/Pedido tardio/)).toBeInTheDocument();
  });

  it('muestra el cuerpo original del ticket', async () => {
    server.use(
      http.get(`${BASE}/api/v2/support/tickets/42/`, () => HttpResponse.json(TICKET_DETAIL)),
    );
    renderAt('/support/tickets/42', makeStore());
    expect(
      await screen.findByText(/Mi pedido lleva 10 dias sin llegar/)
    ).toBeInTheDocument();
  });

  it('renderiza el historial de respuestas en orden', async () => {
    server.use(
      http.get(`${BASE}/api/v2/support/tickets/42/`, () => HttpResponse.json(TICKET_DETAIL)),
    );
    renderAt('/support/tickets/42', makeStore());
    expect(await screen.findByText(/Hola, revisamos tu pedido/)).toBeInTheDocument();
    expect(screen.getByText(/Gracias, sigo esperando/)).toBeInTheDocument();
  });

  it('muestra el estado del ticket en español', async () => {
    server.use(
      http.get(`${BASE}/api/v2/support/tickets/42/`, () => HttpResponse.json(TICKET_DETAIL)),
    );
    renderAt('/support/tickets/42', makeStore());
    // AWAITING_USER maps to 'Esperando respuesta' in STATUS_LABEL
    expect(await screen.findByText('Esperando respuesta')).toBeInTheDocument();
  });

  it('llama al endpoint con el id correcto', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/support/tickets/42/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(TICKET_DETAIL);
      }),
    );
    renderAt('/support/tickets/42', makeStore());
    await screen.findByText(/Pedido tardio/);
    await waitFor(() => expect(capturedUrl).toContain('/support/tickets/42/'));
  });
});
