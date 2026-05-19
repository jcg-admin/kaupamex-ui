/**
 * Tests — AdminOrderDetailPage (UC-ORD-07 transicion + UC-ORD-08 cancelacion admin)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import ordersReducer from '@redux/slices/ordersSlice';
import AdminOrderDetailPage from './AdminOrderDetailPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => {
  const store = configureStore({ reducer: { orders: ordersReducer } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={makeClient()}>
        <MemoryRouter initialEntries={['/admin/orders/PY-2026-000101']}>
          <Routes>
            <Route path="/admin/orders/:id" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

const ORDER = {
  id: 1,
  order_number: 'PY-2026-000101',
  status: 'PENDING',
  status_display: 'Pendiente',
  created_at: '2026-05-10T10:00:00Z',
  user: { email: 'cliente@example.com' },
  items: [
    { id: 11, product_name: 'Tambor Bata', variant_label: 'M',
      unit_price: '500.00', quantity: 1, subtotal: '500.00' },
  ],
  value: {
    subtotal: '500.00', tax: '80.00', shipping_cost: '50.00',
    discount: '0.00', total: '630.00',
  },
};

afterEach(() => jest.clearAllMocks());

describe('AdminOrderDetailPage (UC-ORD-07 detalle + transicion)', () => {
  it('muestra el numero y estado de la orden', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    render(wrap(<AdminOrderDetailPage />));
    expect(
      await screen.findByRole('heading', { name: /Pedido PY-2026-000101/i })
    ).toBeInTheDocument();
    expect(screen.getByText('cliente@example.com')).toBeInTheDocument();
  });

  it('aplica una transicion via PATCH /admin/orders/:n/status/', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    apiService.patch.mockResolvedValue({ data: { ...ORDER, status: 'PROCESSING' } });
    const user = userEvent.setup();

    render(wrap(<AdminOrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000101/i });

    await user.selectOptions(screen.getByLabelText(/Nuevo estado/i), 'PROCESSING');
    await user.click(screen.getByRole('button', { name: /Aplicar transicion/i }));

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/admin/orders/PY-2026-000101/status/',
        expect.objectContaining({
          new_status: 'PROCESSING',
        }),
      );
    });
  });

  it('no permite transiciones desde un estado terminal (DELIVERED)', async () => {
    apiService.get.mockResolvedValue({ data: { ...ORDER, status: 'DELIVERED' } });
    render(wrap(<AdminOrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000101/i });
    expect(screen.queryByLabelText(/Nuevo estado/i)).not.toBeInTheDocument();
  });
});

describe('AdminOrderDetailPage (UC-ORD-08 cancelacion admin)', () => {
  it('cancela un pedido con motivo (>= 10 caracteres) via POST /admin/.../cancel/', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    apiService.post.mockResolvedValue({ data: { ...ORDER, status: 'CANCELLED' } });
    const user = userEvent.setup();

    render(wrap(<AdminOrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000101/i });

    await user.click(screen.getByRole('button', { name: /Cancelar este pedido/i }));
    await user.type(
      screen.getByLabelText(/Motivo \(obligatorio/i),
      'Cliente solicito cancelacion por correo electronico',
    );
    await user.click(screen.getByRole('button', { name: /Confirmar cancelacion/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/orders/PY-2026-000101/cancel/',
        expect.objectContaining({
          reason: expect.stringMatching(/Cliente solicito/),
        }),
      );
    });
  });

  it('boton confirmar deshabilitado si motivo es muy corto', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    const user = userEvent.setup();

    render(wrap(<AdminOrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000101/i });

    await user.click(screen.getByRole('button', { name: /Cancelar este pedido/i }));
    await user.type(screen.getByLabelText(/Motivo \(obligatorio/i), 'corto');
    expect(
      screen.getByRole('button', { name: /Confirmar cancelacion/i })
    ).toBeDisabled();
  });

  it('no muestra cancelacion en pedidos SHIPPED', async () => {
    apiService.get.mockResolvedValue({ data: { ...ORDER, status: 'SHIPPED' } });
    render(wrap(<AdminOrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000101/i });
    expect(screen.queryByRole('button', { name: /Cancelar este pedido/i })).not.toBeInTheDocument();
  });
});
