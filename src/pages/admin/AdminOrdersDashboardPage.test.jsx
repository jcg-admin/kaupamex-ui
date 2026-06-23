/**
 * Tests — AdminOrdersDashboardPage (UC-ORD-10)
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import AdminOrdersDashboardPage from './AdminOrdersDashboardPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const DATA = {
  order_counts: {
    pending: 5, processing: 3, in_preparation: 2, shipped: 1, total_active: 11,
  },
  expiring_orders: [
    { order_number: 'PY-2026-000900', user__email: 'lento@example.com',
      created_at: '2026-05-19T08:00:00Z' },
  ],
  day_summary: { orders_count: 7, total_revenue: '12500.00' },
  latest_orders: [
    { order_number: 'PY-2026-000999', status: 'PENDING',
      created_at: '2026-05-19T09:00:00Z',
      user__email: 'reciente@example.com', value__total: '999.00' },
  ],
  payment_timeout_minutes: 30,
};

describe('AdminOrdersDashboardPage (UC-ORD-10)', () => {
  it('muestra el titulo del dashboard', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/dashboard/`, () => HttpResponse.json(DATA)),
    );
    render(wrap(<AdminOrdersDashboardPage />));
    expect(
      await screen.findByRole('heading', { name: /Dashboard transaccional/i })
    ).toBeInTheDocument();
  });

  it('renderiza contadores por estado', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/dashboard/`, () => HttpResponse.json(DATA)),
    );
    render(wrap(<AdminOrdersDashboardPage />));
    await screen.findByRole('heading', { name: /Pedidos por estado/i });
    expect(screen.getByText(/Pendientes/i).parentElement).toHaveTextContent('5');
    expect(screen.getByText(/En proceso/i).parentElement).toHaveTextContent('3');
    expect(screen.getByText(/Activos/i).parentElement).toHaveTextContent('11');
  });

  it('renderiza ordenes proximas a expirar', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/dashboard/`, () => HttpResponse.json(DATA)),
    );
    render(wrap(<AdminOrdersDashboardPage />));
    expect(await screen.findByText('PY-2026-000900')).toBeInTheDocument();
    expect(screen.getByText('lento@example.com')).toBeInTheDocument();
  });

  it('renderiza ultimos pedidos con enlace al detalle', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/dashboard/`, () => HttpResponse.json(DATA)),
    );
    render(wrap(<AdminOrdersDashboardPage />));
    const link = await screen.findByRole('link', { name: 'PY-2026-000999' });
    expect(link).toHaveAttribute('href', '/admin/orders/PY-2026-000999');
  });

  it('llama al endpoint /api/v1/admin/dashboard/', async () => {
    let requested = false;
    server.use(
      http.get(`${BASE}/api/v1/admin/dashboard/`, ({ request }) => {
        requested = true;
        return HttpResponse.json(DATA);
      }),
    );
    render(wrap(<AdminOrdersDashboardPage />));
    await screen.findByRole('heading', { name: /Dashboard transaccional/i });
    expect(requested).toBe(true);
  });
});
