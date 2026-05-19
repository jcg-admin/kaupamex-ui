/**
 * Tests — CheckoutPage (UC-ORD-01)
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import ordersReducer from '@redux/slices/ordersSlice';
import authReducer from '@redux/slices/authSlice';
import CheckoutPage from './CheckoutPage';

const wrap = ({ isAuthenticated = true } = {}) => {
  const store = configureStore({
    reducer: { orders: ordersReducer, auth: authReducer },
    preloadedState: {
      auth: {
        user: isAuthenticated ? { id: 1, email: 'a@b.com' } : null,
        isAuthenticated,
        accessToken:  isAuthenticated ? 'token' : null,
        refreshToken: isAuthenticated ? 'rtoken' : null,
        status: 'idle',
        error:  null,
      },
    },
  });
  return (
    <Provider store={store}>
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route
            path="/order/:id/confirmation"
            element={<div>Confirmacion {window?.__lastOrder ?? ''}</div>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

const fillAddress = async (user) => {
  await user.type(screen.getByLabelText(/Destinatario/i),    'Juana Perez');
  await user.type(screen.getByLabelText(/Calle y numero/i),  'Av. Reforma 123');
  await user.type(screen.getByLabelText(/Ciudad/i),          'CDMX');
  await user.type(screen.getByLabelText(/Estado/i),          'CDMX');
  await user.type(screen.getByLabelText(/Codigo postal/i),   '06600');
  await user.type(screen.getByLabelText(/ID metodo de envio/i), '2');
};

afterEach(() => jest.clearAllMocks());

describe('CheckoutPage (UC-ORD-01)', () => {
  it('muestra el titulo del checkout', () => {
    render(wrap());
    expect(
      screen.getByRole('heading', { name: /Finalizar compra/i })
    ).toBeInTheDocument();
  });

  it('crea la orden via POST /api/v1/checkout/ con direccion y metodo de envio', async () => {
    apiService.post.mockResolvedValue({
      data: { order_number: 'PY-2026-000123', status: 'PENDING' },
    });
    const user = userEvent.setup();
    render(wrap());

    await fillAddress(user);
    await user.click(screen.getByLabelText(/Acepto los terminos/i));
    await user.click(screen.getByRole('button', { name: /Confirmar pedido/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/checkout/',
        expect.objectContaining({
          address: expect.objectContaining({
            recipient_name: 'Juana Perez',
            zip_code: '06600',
            country:  'MX',
          }),
          shipping_method_id: 2,
        }),
      );
    });
  });

  it('muestra error cuando el backend devuelve un fallo', async () => {
    apiService.post.mockRejectedValue({
      status: 409,
      body: { detail: 'Stock insuficiente para algunos items.' },
      message: 'Stock insuficiente para algunos items.',
    });
    const user = userEvent.setup();
    render(wrap());

    await fillAddress(user);
    await user.click(screen.getByLabelText(/Acepto los terminos/i));
    await user.click(screen.getByRole('button', { name: /Confirmar pedido/i }));

    expect(
      await screen.findByText(/Stock insuficiente/i)
    ).toBeInTheDocument();
  });

  it('el boton esta deshabilitado hasta aceptar terminos', () => {
    render(wrap());
    expect(
      screen.getByRole('button', { name: /Confirmar pedido/i })
    ).toBeDisabled();
  });

  describe('guest checkout (UC-ORD-01 invitado)', () => {
    it('renderiza aviso de compra como invitado cuando no hay sesion', () => {
      render(wrap({ isAuthenticated: false }));
      expect(screen.getByRole('note')).toHaveTextContent(/comprando como invitado/i);
    });

    it('pide email y nombre del invitado y los manda en el payload', async () => {
      apiService.post.mockResolvedValue({
        data: { order_number: 'PY-2026-000999', status: 'PENDING' },
      });
      const user = userEvent.setup();
      render(wrap({ isAuthenticated: false }));

      await user.type(screen.getByLabelText(/Correo electronico/i), 'guest@example.com');
      await user.type(screen.getByLabelText(/Nombre completo/i),    'Visitante Anonimo');
      await fillAddress(user);
      await user.click(screen.getByLabelText(/Acepto los terminos/i));
      await user.click(screen.getByRole('button', { name: /Confirmar pedido/i }));

      await waitFor(() => {
        expect(apiService.post).toHaveBeenCalledWith(
          '/api/v1/checkout/',
          expect.objectContaining({
            guest_email: 'guest@example.com',
            guest_name:  'Visitante Anonimo',
          }),
        );
      });
    });
  });
});
