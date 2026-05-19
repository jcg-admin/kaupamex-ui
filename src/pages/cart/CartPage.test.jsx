/**
 * Tests — CartPage (UC-CART-02: ver y editar carrito).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    post:   jest.fn(),
    patch:  jest.fn(),
    delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';
import cartReducer from '@redux/slices/cartSlice';
import CartPage   from './CartPage';

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

const CART_PAYLOAD = {
  items: [
    {
      id: 11,
      product_id: 4321,
      variant_id: 87,
      name: 'Collar Yemaya',
      variant_name: 'Mediano',
      price: 199.00,
      quantity: 2,
      stock: 5,
    },
    {
      id: 12,
      product_id: 9999,
      variant_id: null,
      name: 'Vela Ogun',
      price: 50.00,
      quantity: 1,
      stock: 10,
    },
  ],
  voucher: null,
};

afterEach(() => jest.clearAllMocks());

describe('CartPage (UC-CART-02 / UC-CART-03 / UC-CART-04 / UC-CART-05)', () => {
  it('al montar, hace GET a /api/cart/ y muestra los items', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    render(wrap(<CartPage />, makeStore()));

    expect(apiService.get).toHaveBeenCalledWith('/api/cart/');
    expect(await screen.findByText(/Collar Yemaya/)).toBeInTheDocument();
    expect(screen.getByText(/Vela Ogun/)).toBeInTheDocument();
  });

  it('muestra el subtotal calculado del carrito', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    render(wrap(<CartPage />, makeStore()));

    // subtotal = 199*2 + 50 = 448
    expect(await screen.findByText(/448/)).toBeInTheDocument();
  });

  it('UC-CART-03 — al hacer click en Eliminar, hace DELETE /api/cart/items/:id/', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    apiService.delete.mockResolvedValue({ data: { ok: true } });
    render(wrap(<CartPage />, makeStore()));

    const removeBtns = await screen.findAllByRole('button', { name: /Eliminar/i });
    fireEvent.click(removeBtns[0]);

    await waitFor(() => {
      expect(apiService.delete).toHaveBeenCalledWith('/api/cart/items/11/');
    });
  });

  it('UC-CART-03 — muestra mensaje cuando el carrito esta vacio', async () => {
    apiService.get.mockResolvedValue({ data: { items: [], voucher: null } });
    render(wrap(<CartPage />, makeStore()));

    expect(
      await screen.findByText(/Tu carrito esta vac[ií]o/i),
    ).toBeInTheDocument();
  });

  it('UC-CART-04 — aplica un cupon via POST /api/cart/voucher/', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    apiService.post.mockResolvedValue({
      data: {
        ...CART_PAYLOAD,
        voucher: { code: 'YORUBA10', type: 'PERCENT', value: 10 },
      },
    });
    render(wrap(<CartPage />, makeStore()));

    await screen.findByText(/Collar Yemaya/);
    fireEvent.change(screen.getByLabelText(/C[oó]digo de cup[oó]n/i),
      { target: { value: 'YORUBA10' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/cart/voucher/',
        { code: 'YORUBA10' },
      );
    });
  });

  it('UC-CART-04 — muestra error si el cupon es invalido', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    apiService.post.mockRejectedValue({
      message: 'El cupon no es valido o ya expiro.',
      code: 'CUPON_INVALIDO',
      status: 400,
    });
    render(wrap(<CartPage />, makeStore()));

    await screen.findByText(/Collar Yemaya/);
    fireEvent.change(screen.getByLabelText(/C[oó]digo de cup[oó]n/i),
      { target: { value: 'NOEXISTE' } });
    fireEvent.click(screen.getByRole('button', { name: /Aplicar/i }));

    expect(await screen.findByText(/no es valido/i)).toBeInTheDocument();
  });

  it('UC-CART-05 — usuario anonimo NO ve el boton de guardar para mas tarde', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    render(wrap(<CartPage />, makeStore()));

    await screen.findByText(/Collar Yemaya/);
    expect(
      screen.queryByRole('button', { name: /Guardar para mas tarde/i }),
    ).not.toBeInTheDocument();
  });

  it('UC-CART-05 — usuario autenticado guarda el carrito via POST /api/cart/save/', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    apiService.post.mockResolvedValue({ data: { saved: true } });
    render(wrap(<CartPage />, makeStore(authedState)));

    await screen.findByText(/Collar Yemaya/);
    fireEvent.click(
      screen.getByRole('button', { name: /Guardar para mas tarde/i }),
    );

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith('/api/cart/save/', {});
    });
    expect(
      await screen.findByText(/Carrito guardado/i),
    ).toBeInTheDocument();
  });

  it('al cambiar la cantidad, hace PATCH /api/cart/items/:id/', async () => {
    apiService.get.mockResolvedValue({ data: CART_PAYLOAD });
    apiService.patch.mockResolvedValue({
      data: {
        items: [{ ...CART_PAYLOAD.items[0], quantity: 3 }, CART_PAYLOAD.items[1]],
        voucher: null,
      },
    });
    render(wrap(<CartPage />, makeStore()));

    const qtyInputs = await screen.findAllByLabelText(/Cantidad/i);
    fireEvent.change(qtyInputs[0], { target: { value: '3' } });
    fireEvent.blur(qtyInputs[0]);

    await waitFor(() => {
      expect(apiService.patch).toHaveBeenCalledWith(
        '/api/cart/items/11/',
        { quantity: 3 },
      );
    });
  });
});
