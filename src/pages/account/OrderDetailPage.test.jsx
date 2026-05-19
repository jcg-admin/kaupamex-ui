/**
 * Tests — OrderDetailPage (UC-ORD-02 / UC-ORD-04 / UC-ORD-05 / UC-ORD-06)
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
import OrderDetailPage from './OrderDetailPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => {
  const store = configureStore({ reducer: { orders: ordersReducer } });
  return (
    <Provider store={store}>
      <QueryClientProvider client={makeClient()}>
        <MemoryRouter initialEntries={['/account/orders/PY-2026-000001']}>
          <Routes>
            <Route path="/account/orders/:id" element={ui} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
};

const ORDER = {
  id: 1,
  order_number: 'PY-2026-000001',
  status: 'PENDING',
  status_display: 'Pendiente',
  created_at: '2026-05-10T10:00:00Z',
  shipping_method_name: 'Estandar',
  items: [
    { id: 11, product_name: 'Camisa Yoruba', variant_label: 'M / Rojo',
      sku: 'YOR-001', unit_price: '500.00', quantity: 2, subtotal: '1000.00' },
  ],
  value: {
    subtotal: '1000.00', tax: '160.00', shipping_cost: '89.00',
    discount: '0.00', total: '1249.00',
  },
  address: {
    recipient_name: 'Juana Perez', street: 'Av. Reforma 123',
    city: 'CDMX', state: 'CDMX', zip_code: '06600', country: 'MX',
    phone: '+525511112222',
  },
};

afterEach(() => jest.clearAllMocks());

describe('OrderDetailPage (UC-ORD-02 detalle)', () => {
  it('muestra el numero de orden como titulo', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    render(wrap(<OrderDetailPage />));
    expect(
      await screen.findByRole('heading', { name: /Pedido PY-2026-000001/i })
    ).toBeInTheDocument();
  });

  it('renderiza items, totales y direccion', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    render(wrap(<OrderDetailPage />));
    expect(await screen.findByText(/Camisa Yoruba/)).toBeInTheDocument();
    expect(screen.getByText(/Juana Perez/)).toBeInTheDocument();
    expect(screen.getByText(/Av\. Reforma 123/)).toBeInTheDocument();
  });
});

describe('OrderDetailPage (UC-ORD-04 cancelar)', () => {
  it('comprador cancela un pedido PENDING via POST /cancel/', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    apiService.post.mockResolvedValue({ data: { ...ORDER, status: 'CANCELLED' } });
    const user = userEvent.setup();

    render(wrap(<OrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000001/i });

    await user.click(screen.getByRole('button', { name: /Cancelar este pedido/i }));
    await user.click(screen.getByRole('button', { name: /Confirmar cancelacion/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/orders/PY-2026-000001/cancel/',
        expect.objectContaining({ reason: '' }),
      );
    });
  });

  it('no muestra boton de cancelar para pedidos enviados', async () => {
    apiService.get.mockResolvedValue({ data: { ...ORDER, status: 'SHIPPED' } });
    render(wrap(<OrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000001/i });
    expect(screen.queryByRole('button', { name: /Cancelar este pedido/i })).not.toBeInTheDocument();
  });
});

describe('OrderDetailPage (UC-ORD-05 editar direccion)', () => {
  it('actualiza la direccion via PATCH /address/', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    apiService.patch.mockResolvedValue({ data: ORDER });
    const user = userEvent.setup();

    render(wrap(<OrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000001/i });

    await user.click(screen.getByRole('button', { name: /Editar direccion/i }));
    await user.click(screen.getByRole('button', { name: /Guardar direccion/i }));

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/orders/PY-2026-000001/address/',
        expect.objectContaining({
          recipient_name: 'Juana Perez',
          zip_code: '06600',
        }),
      );
    });
  });
});

describe('OrderDetailPage (UC-ORD-06 cambiar envio)', () => {
  it('cambia el metodo de envio via PATCH /shipping/', async () => {
    apiService.get.mockResolvedValue({ data: ORDER });
    apiService.patch.mockResolvedValue({ data: ORDER });
    const user = userEvent.setup();

    render(wrap(<OrderDetailPage />));
    await screen.findByRole('heading', { name: /Pedido PY-2026-000001/i });

    await user.click(screen.getByRole('button', { name: /Cambiar metodo de envio/i }));
    await user.type(screen.getByLabelText(/ID del nuevo metodo de envio/i), '3');
    await user.click(screen.getByRole('button', { name: /Aplicar cambio/i }));

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/v1/orders/PY-2026-000001/shipping/',
        { shipping_method_id: 3 },
      );
    });
  });
});
