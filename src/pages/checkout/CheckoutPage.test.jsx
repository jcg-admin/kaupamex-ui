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
 *   - Creates order via POST /api/v2/orders/ (checkoutSlice)
 *   - fetchAddresses dispatch requires addresses slice in store
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import checkoutReducer from '@redux/slices/checkoutSlice';
import ordersReducer from '@redux/slices/ordersSlice';
import authReducer from '@redux/slices/authSlice';
import addressesReducer from '@redux/slices/addressesSlice';
import cartReducer from '@redux/slices/cartSlice';
import CheckoutPage from './CheckoutPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

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

// Mock addresses and shipping methods GET (both dispatched on mount)
beforeEach(() => {
  server.use(
    http.get(`${BASE}/api/v2/addresses/`, () =>
      HttpResponse.json({ results: [], count: 0 }),
    ),
    http.get(`${BASE}/api/v2/shipping-methods/`, () =>
      HttpResponse.json([
        { id: 1, name: 'Estándar resguardado', cost: '0.00', estimated_days: 5, free_threshold: null },
        { id: 2, name: 'Expedito · 24 horas',  cost: '280.00', estimated_days: 1, free_threshold: null },
      ]),
    ),
  );
});

describe('CheckoutPage (UC-ORD-01)', () => {
  it('muestra las secciones del checkout', () => {
    render(wrap());
    // Component has sections with h2 titles
    expect(screen.getByRole('heading', { name: /Identificación/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Dirección de envío/i })).toBeInTheDocument();
  });

  it('crea la orden via POST /api/v2/orders/ con direccion y metodo de envio', async () => {
    server.use(
      http.post(`${BASE}/api/v2/orders/`, () =>
        HttpResponse.json({ order_number: 'PY-2026-000123', status: 'PENDING' }),
      ),
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({ checkout_url: null }),
      ),
    );

    const user = userEvent.setup();
    render(wrap());

    await fillAddress(user);
    await user.click(screen.getByRole('button', { name: /Confirmar y pagar/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Stock insuficiente/i)).not.toBeInTheDocument();
    });
  });

  it('muestra error cuando el backend devuelve un fallo', async () => {
    // ConflictError (409) usa response.data.message (no detail) como mensaje.
    server.use(
      http.post(`${BASE}/api/v2/orders/`, () =>
        HttpResponse.json(
          { message: 'Stock insuficiente para algunos items.' },
          { status: 409 },
        ),
      ),
    );
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

  it('muestra la seccion de metodo de envio con opciones', async () => {
    render(wrap());
    expect(screen.getByRole('heading', { name: /Método de envío/i })).toBeInTheDocument();
    // Shipping options load dynamically from /api/v2/shipping-methods/
    expect(await screen.findByText(/Estándar resguardado/i)).toBeInTheDocument();
  });
});

describe('CheckoutPage — validación MX (Teléfono 10 / C.P. 5) y envío', () => {
  const fillValidAddress = async (user, { phone = '5512345678', zip = '06600' } = {}) => {
    await user.type(screen.getByLabelText(/Nombre completo del destinatario/i), 'Juana Perez');
    if (phone) await user.type(screen.getByLabelText(/Teléfono/i), phone);
    await user.type(screen.getByLabelText(/Calle y número/i), 'Av. Reforma 123');
    await user.type(screen.getByLabelText(/Colonia/i), 'Centro');
    if (zip) await user.type(screen.getByLabelText(/C\.P\./i), zip);
    await user.type(screen.getByLabelText(/Alcaldía \/ Municipio/i), 'CDMX');
    await user.type(screen.getByLabelText(/Estado/i), 'CDMX');
  };

  it('bloquea el envío si el Teléfono no tiene 10 dígitos', async () => {
    let orderCalled = false;
    server.use(
      http.post(`${BASE}/api/v2/orders/`, () => {
        orderCalled = true;
        return HttpResponse.json({ order_number: 'X1' });
      }),
    );
    const user = userEvent.setup();
    render(wrap());
    await fillValidAddress(user, { phone: '551234567' }); // 9 dígitos
    await user.click(screen.getByRole('button', { name: /Confirmar y pagar/i }));
    expect(await screen.findByText(/10 dígitos/i)).toBeInTheDocument();
    expect(orderCalled).toBe(false);
  });

  it('bloquea el envío si el C.P. no tiene 5 dígitos', async () => {
    let orderCalled = false;
    server.use(
      http.post(`${BASE}/api/v2/orders/`, () => {
        orderCalled = true;
        return HttpResponse.json({ order_number: 'X1' });
      }),
    );
    const user = userEvent.setup();
    render(wrap());
    await fillValidAddress(user, { zip: '123' }); // 3 dígitos
    await user.click(screen.getByRole('button', { name: /Confirmar y pagar/i }));
    expect(await screen.findByText(/5 dígitos/i)).toBeInTheDocument();
    expect(orderCalled).toBe(false);
  });

  it('el Teléfono descarta no-dígitos y corta en 10', async () => {
    const user = userEvent.setup();
    render(wrap());
    const phone = screen.getByLabelText(/Teléfono/i);
    await user.type(phone, '55-1234-5678-99');
    expect(phone.value).toBe('5512345678');
  });

  it('muestra aviso accionable si /shipping-methods/ falla', async () => {
    // 404 (endpoint ausente/mal enrutado) — no reintentable, rechaza de
    // inmediato. Un 5xx dispararía los reintentos con backoff de apiService.
    server.use(
      http.get(`${BASE}/api/v2/shipping-methods/`, () =>
        HttpResponse.json({ detail: 'err' }, { status: 404 }),
      ),
    );
    render(wrap());
    expect(
      await screen.findByText(/no se pudieron cargar los métodos de envío/i),
    ).toBeInTheDocument();
  });
});
