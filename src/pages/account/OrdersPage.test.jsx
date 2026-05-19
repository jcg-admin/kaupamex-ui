/**
 * Tests — OrdersPage (UC-ORD-03)
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import OrdersPage from './OrdersPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const ORDERS = [
  { order_number: 'PY-2026-000001', status: 'PENDING',   status_display: 'Pendiente',
    created_at: '2026-05-10T10:00:00Z', total: '1249.00', items_count: 2 },
  { order_number: 'PY-2026-000002', status: 'SHIPPED',   status_display: 'Enviado',
    created_at: '2026-05-09T10:00:00Z', total: '599.00',  items_count: 1 },
  { order_number: 'PY-2026-000003', status: 'CANCELLED', status_display: 'Cancelado',
    created_at: '2026-05-01T10:00:00Z', total: '320.00',  items_count: 3 },
];

afterEach(() => jest.clearAllMocks());

describe('OrdersPage (UC-ORD-03 listado)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 3 } });
    render(wrap(<OrdersPage />));
    expect(
      await screen.findByRole('heading', { name: /Mis pedidos/i })
    ).toBeInTheDocument();
  });

  it('renderiza el numero de orden de cada pedido', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 3 } });
    render(wrap(<OrdersPage />));
    expect(await screen.findByText('PY-2026-000001')).toBeInTheDocument();
    expect(screen.getByText('PY-2026-000002')).toBeInTheDocument();
    expect(screen.getByText('PY-2026-000003')).toBeInTheDocument();
  });

  it('muestra el estado de cada pedido en espanol', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 3 } });
    render(wrap(<OrdersPage />));
    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Enviado')).toBeInTheDocument();
    expect(screen.getByText('Cancelado')).toBeInTheDocument();
  });

  it('enlaza al detalle de cada orden', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 3 } });
    render(wrap(<OrdersPage />));
    const link = await screen.findByRole('link', { name: /PY-2026-000001/ });
    expect(link).toHaveAttribute('href', '/account/orders/PY-2026-000001');
  });

  it('muestra estado vacio cuando no hay pedidos', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], count: 0 } });
    render(wrap(<OrdersPage />));
    expect(
      await screen.findByText(/No tienes pedidos registrados/i)
    ).toBeInTheDocument();
  });

  it('llama al endpoint /api/v1/orders/', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 3 } });
    render(wrap(<OrdersPage />));
    await screen.findByText('PY-2026-000001');
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/orders/',
      expect.objectContaining({ params: {} }),
    );
  });
});
