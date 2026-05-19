/**
 * Tests — AdminOrdersPage (UC-ORD-09 — listado/filtro admin)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import AdminOrdersPage from './AdminOrdersPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const ORDERS = [
  {
    order_number: 'PY-2026-000101', status: 'PENDING',
    status_display: 'Pendiente',
    created_at: '2026-05-10T10:00:00Z',
    value: { total: '1249.00' },
    user: { email: 'cliente@example.com' },
  },
  {
    order_number: 'PY-2026-000102', status: 'SHIPPED',
    status_display: 'Enviado',
    created_at: '2026-05-09T10:00:00Z',
    value: { total: '599.00' },
    guest_email: 'invitado@example.com',
  },
];

afterEach(() => jest.clearAllMocks());

describe('AdminOrdersPage (UC-ORD-09)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    render(wrap(<AdminOrdersPage />));
    expect(
      await screen.findByRole('heading', { name: /Pedidos/i })
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con las ordenes', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    render(wrap(<AdminOrdersPage />));
    expect(await screen.findByText('PY-2026-000101')).toBeInTheDocument();
    expect(screen.getByText('PY-2026-000102')).toBeInTheDocument();
    expect(screen.getByText('cliente@example.com')).toBeInTheDocument();
    expect(screen.getByText('invitado@example.com')).toBeInTheDocument();
  });

  it('aplica filtros acumulativos al endpoint admin', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    const user = userEvent.setup();
    render(wrap(<AdminOrdersPage />));

    await screen.findByText('PY-2026-000101');

    await user.type(screen.getByLabelText(/Numero de orden/i), 'PY-2026');
    await user.selectOptions(screen.getByLabelText(/Estado/i), 'PROCESSING');
    await user.type(screen.getByLabelText(/Email del comprador/i), 'cliente@');
    await user.click(screen.getByRole('button', { name: /Aplicar filtros/i }));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/orders/',
        expect.objectContaining({
          params: expect.objectContaining({
            order_number: 'PY-2026',
            status:       'PROCESSING',
            email:        'cliente@',
          }),
        }),
      );
    });
  });

  it('enlaza al detalle admin de cada orden', async () => {
    apiService.get.mockResolvedValue({ data: { results: ORDERS, count: 2 } });
    render(wrap(<AdminOrdersPage />));
    await screen.findByText('PY-2026-000101');
    const links = screen.getAllByRole('link', { name: /Ver detalle/i });
    expect(links[0]).toHaveAttribute('href', '/admin/orders/PY-2026-000101');
  });
});
