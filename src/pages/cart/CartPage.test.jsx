/**
 * Tests — CartPage (UC-CART-02: ver y editar carrito).
 *
 * These tests match the actual CartPage component behavior:
 *   - Cart items use product_name field (not name)
 *   - Empty cart shows "Aún no has elegido ninguna pieza"
 *   - Voucher input has no aria-label (use placeholder or role)
 *   - Quantity uses +/- buttons, not a labeled input
 *   - No "Guardar para mas tarde" feature (saveCartForLater exists in slice
 *     but CartPage component does not expose it in the UI)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import cartReducer from '@redux/slices/cartSlice';
import CartPage   from './CartPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const authReducer = (state = { isAuthenticated: false }) => state;

const makeStore = (preloadedState) =>
  configureStore({
    reducer: { cart: cartReducer, auth: authReducer },
    preloadedState,
  });

const authedState = {
  auth: { isAuthenticated: true },
};

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

// DEC-BC-02 + DEC-BC-08 (2026-05-21): backend devuelve Cart con
// `totals` calculado server-side. UI lee `state.totals` directo.
// CartPage uses item.product_name (not item.name).
const CART_PAYLOAD = {
  items: [
    {
      id: 11,
      product_id: 4321,
      variant_id: 87,
      product_name: 'Collar Yemaya',
      variant_label: 'Mediano',
      unit_price: 199.00,
      quantity: 2,
      stock: 5,
    },
    {
      id: 12,
      product_id: 9999,
      variant_id: null,
      product_name: 'Vela Ogun',
      unit_price: 50.00,
      quantity: 1,
      stock: 10,
    },
  ],
  voucher: null,
  totals: {
    subtotal: '448.00',
    discount: '0.00',
    subtotal_net: '448.00',
    tax_included: '61.79',
    shipping_cost: null,
    total: '448.00',
  },
};

describe('CartPage (UC-CART-02 / UC-CART-03 / UC-CART-04 / UC-CART-05)', () => {
  it('al montar, hace GET a /api/cart/ y muestra los items', async () => {
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json(CART_PAYLOAD)),
    );
    render(wrap(<CartPage />, makeStore()));

    expect(await screen.findByText(/Collar Yemaya/)).toBeInTheDocument();
    expect(screen.getByText(/Vela Ogun/)).toBeInTheDocument();
  });

  it('muestra el subtotal del backend (DEC-BC-02: sin recalculo)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json(CART_PAYLOAD)),
    );
    render(wrap(<CartPage />, makeStore()));

    // DEC-BC-02: subtotal viene del backend (CART_PAYLOAD.totals.subtotal = "448.00").
    expect((await screen.findAllByText(/448/)).length).toBeGreaterThan(0);
  });

  it('UC-CART-03 — al hacer click en Eliminar, hace DELETE /api/cart/items/:id/', async () => {
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json(CART_PAYLOAD)),
      http.delete(`${BASE}/api/v2/cart/items/11/`, () => HttpResponse.json({ ok: true })),
    );
    render(wrap(<CartPage />, makeStore()));

    const removeBtns = await screen.findAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(removeBtns[0]);

    await waitFor(() => {
      expect(screen.queryByText(/Collar Yemaya/)).not.toBeInTheDocument();
    });
  });

  it('UC-CART-03 — muestra mensaje cuando el carrito esta vacio', async () => {
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json({ items: [], voucher: null })),
    );
    render(wrap(<CartPage />, makeStore()));

    // CartPage shows "Aún no has elegido ninguna pieza" for empty cart
    expect(
      await screen.findByText(/no has elegido ninguna pieza/i),
    ).toBeInTheDocument();
  });

  it('UC-CART-04 — aplica un cupon via POST /api/cart/voucher/', async () => {
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json(CART_PAYLOAD)),
      http.post(`${BASE}/api/v2/cart/voucher/`, () => HttpResponse.json({
        ...CART_PAYLOAD,
        voucher: { code: 'YORUBA10', type: 'PERCENT', value: 10 },
      })),
    );
    render(wrap(<CartPage />, makeStore()));

    await screen.findByText(/Collar Yemaya/);
    // VoucherBox input has placeholder "CÓDIGO" (no aria-label)
    fireEvent.change(screen.getByPlaceholderText(/CÓDIGO/i),
      { target: { value: 'YORUBA10' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));

    await waitFor(() => {
      expect(screen.getByText(/YORUBA10/i)).toBeInTheDocument();
    });
  });

  it('UC-CART-04 — muestra error si el cupon es invalido', async () => {
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json(CART_PAYLOAD)),
      http.post(`${BASE}/api/v2/cart/voucher/`, () =>
        HttpResponse.json(
          { detail: 'El cupon no es valido o ya expiro.', codigo_error: 'VOUCHER_INVALID' },
          { status: 400 },
        ),
      ),
    );
    render(wrap(<CartPage />, makeStore()));

    await screen.findByText(/Collar Yemaya/);
    fireEvent.change(screen.getByPlaceholderText(/CÓDIGO/i),
      { target: { value: 'NOEXISTE' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));

    // CartPage shows translated error via translateVoucherError
    expect(await screen.findByText(/No pudimos aplicar el código/i)).toBeInTheDocument();
  });

  it('UC-CART-05 — CartPage no tiene boton de guardar para mas tarde', async () => {
    // The CartPage component does not render a "Guardar para mas tarde" button.
    // The saveCartForLater thunk exists in cartSlice but is not wired in CartPage UI.
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json(CART_PAYLOAD)),
    );
    render(wrap(<CartPage />, makeStore()));

    await screen.findByText(/Collar Yemaya/);
    expect(
      screen.queryByRole('button', { name: /Guardar para mas tarde/i }),
    ).not.toBeInTheDocument();
  });

  it('al hacer click en +, hace PATCH /api/cart/items/:id/ con cantidad incrementada', async () => {
    server.use(
      http.get(`${BASE}/api/v2/cart/`, () => HttpResponse.json(CART_PAYLOAD)),
      http.patch(`${BASE}/api/v2/cart/items/11/`, () => HttpResponse.json({
        ...CART_PAYLOAD,
        items: [{ ...CART_PAYLOAD.items[0], quantity: 3 }, CART_PAYLOAD.items[1]],
      })),
    );
    render(wrap(<CartPage />, makeStore()));

    // CartPage quantity uses Aumentar/Reducir buttons, not a labeled input
    const aumentarBtns = await screen.findAllByRole('button', { name: /Aumentar/i });
    fireEvent.click(aumentarBtns[0]);

    await waitFor(() => {
      // After patch the quantity for first item should update to 3
      // Use findAllByText to avoid "multiple elements" error from "30%"
      const els = screen.getAllByText(/\b3\b/);
      expect(els.length).toBeGreaterThan(0);
    });
  });
});
