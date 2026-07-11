/**
 * Tests — AdminSupportPage
 * UC-SUPP-05: Bandeja y reporte de tickets (Admin)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import supportTicketsReducer from '@redux/slices/supportTicketsSlice';
import AdminSupportPage from './AdminSupportPage';

const makeStore = () =>
  configureStore({ reducer: { supportTickets: supportTicketsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const TICKETS = [
  { ticket_id: 100, subject: 'Pedido perdido',     status: 'OPEN',        created_at: '2026-05-10T10:00:00Z',
    customer: { id: 1, email: 'comprador@test.mx', name: 'Demo Yoruba' }, replies_count: 0 },
  { ticket_id: 101, subject: 'Producto defectuoso', status: 'IN_PROGRESS', created_at: '2026-05-12T10:00:00Z',
    customer: { id: 2, email: 'maria@test.mx',      name: 'Maria Lopez' }, replies_count: 2 },
  { ticket_id: 102, subject: 'Caso resuelto',       status: 'CLOSED',      created_at: '2026-05-05T10:00:00Z',
    customer: { id: 3, email: 'juan@test.mx',       name: 'Juan Diaz' },   replies_count: 4 },
];

const RESPONSE = {
  results: TICKETS,
  metrics: { open: 1, in_progress: 1, awaiting_user: 0, resolved: 0, closed: 1 },
};

describe('AdminSupportPage (UC-SUPP-05)', () => {
  it('muestra el titulo de la bandeja', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Bandeja de soporte/i })
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con todos los tickets', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(await screen.findByText('Pedido perdido')).toBeInTheDocument();
    expect(screen.getByText('Producto defectuoso')).toBeInTheDocument();
    expect(screen.getByText('Caso resuelto')).toBeInTheDocument();
  });

  it('muestra el email del comprador en cada fila', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(await screen.findByText('comprador@test.mx')).toBeInTheDocument();
    expect(screen.getByText('maria@test.mx')).toBeInTheDocument();
  });

  it('muestra el panel de metricas del periodo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(await screen.findByText(/Abiertos/i)).toBeInTheDocument();
    expect(screen.getByText(/En proceso/i)).toBeInTheDocument();
    expect(screen.getByText(/Cerrados/i)).toBeInTheDocument();
  });

  it('filtra el listado por estado al elegir un segmento', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminSupportPage />, makeStore()));
    await screen.findByText('Pedido perdido');

    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json(RESPONSE);
      }),
    );

    // El filtro de estado es un SegmentedControl: el badge de conteo va
    // aria-hidden, así que el nombre accesible del segmento es solo la etiqueta.
    fireEvent.click(screen.getByRole('button', { name: 'Abierto' }));

    await waitFor(() => {
      expect(lastUrl).toContain('/admin/support/tickets/');
      expect(lastUrl).toContain('status=OPEN');
    });
  });

  it('muestra estado vacio cuando no hay tickets', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/support/tickets/`, () =>
        HttpResponse.json({ results: [], metrics: null }),
      ),
    );
    render(wrap(<AdminSupportPage />, makeStore()));
    expect(
      await screen.findByText(/No se encontraron tickets/i)
    ).toBeInTheDocument();
  });
});
