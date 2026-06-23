/**
 * Tests — OrdersPage (UC-ORD-03)
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import ordersReducer from '@redux/slices/ordersSlice';
import OrdersPage from './OrdersPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { orders: ordersReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <Provider store={makeStore()}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const ORDERS = [
  { order_number: 'PY-2026-000001', status: 'PENDING',   status_display: 'Pendiente',
    created_at: '2026-05-10T10:00:00Z', total: '1249.00', items_count: 2 },
  { order_number: 'PY-2026-000002', status: 'SHIPPED',   status_display: 'Enviado',
    created_at: '2026-05-09T10:00:00Z', total: '599.00',  items_count: 1 },
  { order_number: 'PY-2026-000003', status: 'CANCELLED', status_display: 'Cancelado',
    created_at: '2026-05-01T10:00:00Z', total: '320.00',  items_count: 3 },
];

describe('OrdersPage (UC-ORD-03 listado)', () => {
  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v1/orders/`, () => HttpResponse.json({ results: ORDERS, count: 3 })),
    );
    render(wrap(<OrdersPage />));
    expect(
      await screen.findByRole('heading', { name: /Mis pedidos/i })
    ).toBeInTheDocument();
  });

  it('renderiza el numero de orden de cada pedido', async () => {
    server.use(
      http.get(`${BASE}/api/v1/orders/`, () => HttpResponse.json({ results: ORDERS, count: 3 })),
    );
    render(wrap(<OrdersPage />));
    expect(await screen.findByText('PY-2026-000001')).toBeInTheDocument();
    expect(screen.getByText('PY-2026-000002')).toBeInTheDocument();
    expect(screen.getByText('PY-2026-000003')).toBeInTheDocument();
  });

  it('muestra el estado de cada pedido en espanol', async () => {
    server.use(
      http.get(`${BASE}/api/v1/orders/`, () => HttpResponse.json({ results: ORDERS, count: 3 })),
    );
    render(wrap(<OrdersPage />));
    // Component uses STATUS_TONE map: PENDING='Pendiente', SHIPPED='En camino', CANCELLED='Cancelado'
    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('En camino')).toBeInTheDocument();
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('enlaza al detalle de cada orden', async () => {
    server.use(
      http.get(`${BASE}/api/v1/orders/`, () => HttpResponse.json({ results: ORDERS, count: 3 })),
    );
    render(wrap(<OrdersPage />));
    // Component links to /account/orders/{order_number}
    await screen.findByText('PY-2026-000001');
    const links = screen.getAllByRole('link');
    const orderLink = links.find((l) => l.getAttribute('href') === '/account/orders/PY-2026-000001');
    expect(orderLink).toBeTruthy();
  });

  it('muestra estado vacio cuando no hay pedidos', async () => {
    server.use(
      http.get(`${BASE}/api/v1/orders/`, () => HttpResponse.json({ results: [], count: 0 })),
    );
    render(wrap(<OrdersPage />));
    // Component renders "Aún no tienes pedidos" when list is empty
    expect(
      await screen.findByText(/Aún no tienes pedidos/i)
    ).toBeInTheDocument();
  });

  it('llama al endpoint /api/v1/orders/', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v1/orders/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: ORDERS, count: 3 });
      }),
    );
    render(wrap(<OrdersPage />));
    await screen.findByText('PY-2026-000001');
    await waitFor(() => expect(capturedUrl).toContain('/api/v1/orders/'));
  });
});
