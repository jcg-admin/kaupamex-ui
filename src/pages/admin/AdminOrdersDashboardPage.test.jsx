/**
 * Tests — AdminOrdersDashboardPage (UC-ORD-10)
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import AdminOrdersDashboardPage from './AdminOrdersDashboardPage';

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

afterEach(() => jest.clearAllMocks());

describe('AdminOrdersDashboardPage (UC-ORD-10)', () => {
  it('muestra el titulo del dashboard', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    render(wrap(<AdminOrdersDashboardPage />));
    expect(
      await screen.findByRole('heading', { name: /Dashboard transaccional/i })
    ).toBeInTheDocument();
  });

  it('renderiza contadores por estado', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    render(wrap(<AdminOrdersDashboardPage />));
    await screen.findByRole('heading', { name: /Pedidos por estado/i });
    expect(screen.getByText(/Pendientes/i).parentElement).toHaveTextContent('5');
    expect(screen.getByText(/En proceso/i).parentElement).toHaveTextContent('3');
    expect(screen.getByText(/Activos/i).parentElement).toHaveTextContent('11');
  });

  it('renderiza ordenes proximas a expirar', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    render(wrap(<AdminOrdersDashboardPage />));
    expect(await screen.findByText('PY-2026-000900')).toBeInTheDocument();
    expect(screen.getByText('lento@example.com')).toBeInTheDocument();
  });

  it('renderiza ultimos pedidos con enlace al detalle', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    render(wrap(<AdminOrdersDashboardPage />));
    const link = await screen.findByRole('link', { name: 'PY-2026-000999' });
    expect(link).toHaveAttribute('href', '/admin/orders/PY-2026-000999');
  });

  it('llama al endpoint /api/v1/admin/dashboard/', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    render(wrap(<AdminOrdersDashboardPage />));
    await screen.findByRole('heading', { name: /Dashboard transaccional/i });
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/dashboard/',
      expect.any(Object),
    );
  });
});
