/**
 * Tests — CheckoutPage (UC-ORD-01)
 *
 * These tests are written to match the actual CheckoutPage component:
 *   - No h1 "Finalizar compra" — sections have h2 titles
 *   - AddressForm fields: "Nombre completo del destinatario", "Calle y número",
 *     "Alcaldía / Municipio", "Estado", "C.P.", etc.
 *   - Submit button: "Confirmar y pagar" (not "Confirmar pedido")
 *   - No "Acepto los términos" checkbox — disclaimer is plain text
 *   - No guest-specific notice/email fields — component always shows email field
 *   - Creates order via POST /api/v1/orders/checkout/ (checkoutSlice)
 *   - fetchAddresses dispatch requires addresses slice in store
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
import checkoutReducer from '@redux/slices/checkoutSlice';
import ordersReducer from '@redux/slices/ordersSlice';
import authReducer from '@redux/slices/authSlice';
import addressesReducer from '@redux/slices/addressesSlice';
import cartReducer from '@redux/slices/cartSlice';
import CheckoutPage from './CheckoutPage';

const wrap = ({ isAuthenticated = true } = {}) => {
  const store = configureStore({
    reducer: {
      checkout:  checkoutReducer,
      orders:    ordersReducer,
      auth:      authReducer,
      addresses: addressesReducer,
      cart:      cartReducer,
    },
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
          <Route path="/order/:id/confirmation" element={<div>Confirmacion</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

// Fill the address form using actual field labels from AddressForm component
const fillAddress = async (user) => {
  await user.type(screen.getByLabelText(/Nombre completo del destinatario/i), 'Juana Perez');
  await user.type(screen.getByLabelText(/Teléfono/i),                         '5512345678');
  await user.type(screen.getByLabelText(/Calle y número/i),                   'Av. Reforma 123');
  await user.type(screen.getByLabelText(/Colonia/i),                           'Centro');
  await user.type(screen.getByLabelText(/C\.P\./i),                            '06600');
  await user.type(screen.getByLabelText(/Alcaldía \/ Municipio/i),             'CDMX');
  await user.type(screen.getByLabelText(/Estado/i),                            'CDMX');
};

// Mock addresses GET (called by fetchAddresses on mount)
beforeEach(() => {
  apiService.get.mockResolvedValue({ data: { results: [], count: 0 } });
});

afterEach(() => jest.clearAllMocks());

describe('CheckoutPage (UC-ORD-01)', () => {
  it('muestra las secciones del checkout', () => {
    render(wrap());
    // Component has sections with h2 titles
    expect(screen.getByRole('heading', { name: /Identificación/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dirección de envío/i })).toBeInTheDocument();
  });

  it('crea la orden via POST /api/v1/orders/checkout/ con direccion y metodo de envio', async () => {
    apiService.post.mockResolvedValue({
      data: { order_number: 'PY-2026-000123', status: 'PENDING' },
    });
    // Also mock the initMercadoPago call (default payment is 'mp')
    apiService.post.mockResolvedValueOnce({
      data: { order_number: 'PY-2026-000123', status: 'PENDING' },
    }).mockResolvedValueOnce({
      data: { checkout_url: null }, // no redirect
    });

    const user = userEvent.setup();
    render(wrap());

    await fillAddress(user);
    await user.click(screen.getByRole('button', { name: /Confirmar y pagar/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/orders/checkout/',
        expect.objectContaining({
          address: expect.objectContaining({
            recipient_name: 'Juana Perez',
            zip_code: '06600',
            country:  'MX',
          }),
        }),
        expect.any(Object), // includes Idempotency-Key header
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
    await user.click(screen.getByRole('button', { name: /Confirmar y pagar/i }));

    expect(
      await screen.findByText(/Stock insuficiente/i)
    ).toBeInTheDocument();
  });

  it('el boton "Confirmar y pagar" esta habilitado por defecto', () => {
    render(wrap());
    // Component button is "Confirmar y pagar" — no terms checkbox required
    expect(
      screen.getByRole('button', { name: /Confirmar y pagar/i })
    ).not.toBeDisabled();
  });

  it('muestra campo de correo de contacto', () => {
    render(wrap());
    // Component has "Correo de contacto" field in Identificación section
    expect(screen.getByLabelText(/Correo de contacto/i)).toBeInTheDocument();
  });

  it('el campo de correo se pre-rellena con el email del usuario autenticado', () => {
    render(wrap({ isAuthenticated: true }));
    const emailInput = screen.getByLabelText(/Correo de contacto/i);
    expect(emailInput.value).toBe('a@b.com');
  });

  it('muestra la seccion de metodo de envio con opciones', () => {
    render(wrap());
    expect(screen.getByRole('heading', { name: /Método de envío/i })).toBeInTheDocument();
    // Shipping options are rendered as buttons
    expect(screen.getByText(/Estándar resguardado/i)).toBeInTheDocument();
  });
});
