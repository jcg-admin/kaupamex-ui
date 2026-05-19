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

const makeStore = (preloadedState) =>
  configureStore({
    reducer: { cart: cartReducer },
    preloadedState,
  });

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

describe('CartPage (UC-CART-02)', () => {
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
