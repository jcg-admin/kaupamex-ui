/**
 * Tests — cartSlice (canonical pattern with serializeApiError).
 * UC-CART-01: agregar producto al carrito.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn() },
}));

import apiService from '@services/apiService';
import cartReducer, {
  addToCart,
  syncCartOnLogin,
  clearCartActionState,
} from './cartSlice';

const makeStore = () =>
  configureStore({ reducer: { cart: cartReducer } });

afterEach(() => jest.clearAllMocks());

describe('cartSlice (UC-CART-01)', () => {
  it('addToCart: hace POST /api/cart/items/ con product_id, variant_id, quantity', async () => {
    apiService.post.mockResolvedValue({ data: { items: [], voucher: null } });
    const store = makeStore();

    await store.dispatch(addToCart({ productId: 4321, variantId: 87, quantity: 2 }));

    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v2/cart/items/',
      { product_id: 4321, variant_id: 87, quantity: 2 },
    );
  });

  it('addToCart: marca lastAction=added en estado tras exito', async () => {
    apiService.post.mockResolvedValue({
      data: {
        items: [{ id: 1, product_id: 4321, name: 'Test', price: 100, quantity: 1 }],
        voucher: null,
      },
    });
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 4321, variantId: null, quantity: 1 }));

    const state = store.getState().cart;
    expect(state.lastAction).toBe('added');
    expect(state.isActioning).toBe(false);
    expect(state.items).toHaveLength(1);
  });

  it('addToCart: en error, guarda actionError serializado (message+code)', async () => {
    apiService.post.mockRejectedValue({
      message: 'Sin stock disponible.',
      code: 'SIN_STOCK',
      status: 400,
    });
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 4321, variantId: null, quantity: 1 }));

    const state = store.getState().cart;
    expect(state.actionError).toMatchObject({
      message: 'Sin stock disponible.',
      code: 'SIN_STOCK',
      statusCode: 400,
    });
    expect(state.isActioning).toBe(false);
  });

  it('UC-CART-06 — syncCartOnLogin: hace POST /api/cart/sync/ y carga items fusionados', async () => {
    apiService.post.mockResolvedValue({
      data: {
        items: [
          { id: 1, product_id: 10, name: 'Anonimo', price: 100, quantity: 1 },
          { id: 2, product_id: 20, name: 'Cuenta',  price: 50,  quantity: 2 },
        ],
        voucher: null,
      },
    });
    const store = makeStore();
    await store.dispatch(syncCartOnLogin());

    expect(apiService.post).toHaveBeenCalledWith('/api/v2/cart/merge/', {});
    const state = store.getState().cart;
    expect(state.items).toHaveLength(2);
    expect(state.lastAction).toBe('synced');
    expect(state.itemCount).toBe(3);
  });

  it('UC-CART-06 — syncCartOnLogin: en error guarda actionError serializado', async () => {
    apiService.post.mockRejectedValue({
      message: 'Error al fusionar',
      code: 'FUSION_ERROR',
      status: 500,
    });
    const store = makeStore();
    await store.dispatch(syncCartOnLogin());
    const state = store.getState().cart;
    expect(state.actionError).toMatchObject({
      message: 'Error al fusionar',
      code: 'FUSION_ERROR',
    });
  });

  it('clearCartActionState: limpia isActioning, actionError y lastAction', () => {
    const store = makeStore();
    store.dispatch({ type: addToCart.rejected.type, payload: { message: 'X' } });
    store.dispatch(clearCartActionState());
    const state = store.getState().cart;
    expect(state.actionError).toBeNull();
    expect(state.lastAction).toBeNull();
  });

  // T-202 — DEC-BC-02: UI usa totals del backend, sin calcular localmente.
  it('totals_from_backend: mapea payload.totals al estado sin recalcular', async () => {
    apiService.post.mockResolvedValue({
      data: {
        items: [{ id: 1, product_id: 10, name: 'P', price: 1000, quantity: 1 }],
        voucher: null,
        totals: { subtotal: 1000, discount: 0, tax: 100, total: 1100 },
      },
    });
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 10, variantId: null, quantity: 1 }));
    const { totals } = store.getState().cart;
    expect(totals.subtotal).toBe(1000);
    expect(totals.tax).toBe(100);
    expect(totals.total).toBe(1100);
    expect(totals.discount).toBe(0);
  });

  it('totals_from_backend: dos respuestas con distinta tasa reflejan la ultima', async () => {
    const store = makeStore();
    apiService.post.mockResolvedValueOnce({
      data: {
        items: [{ id: 1 }],
        voucher: null,
        totals: { subtotal: 100, discount: 0, tax: 10, total: 110 },
      },
    });
    await store.dispatch(addToCart({ productId: 1, variantId: null, quantity: 1 }));
    expect(store.getState().cart.totals.tax).toBe(10);

    apiService.post.mockResolvedValueOnce({
      data: {
        items: [{ id: 1 }],
        voucher: null,
        totals: { subtotal: 100, discount: 0, tax: 16, total: 116 },
      },
    });
    await store.dispatch(addToCart({ productId: 1, variantId: null, quantity: 1 }));
    expect(store.getState().cart.totals.tax).toBe(16);
    expect(store.getState().cart.totals.total).toBe(116);
  });

  // T-309 — DEC-BC-08: items persisten en estado tras addToCart exitoso.
  it('cart_item_added_state_persists: items.length > 0 tras addToCart exitoso', async () => {
    apiService.post.mockResolvedValue({
      data: {
        items: [{ id: 1, product_id: 5, name: 'Pulcera', price: 250, quantity: 1 }],
        voucher: null,
        totals: { subtotal: 250, discount: 0, tax: 0, total: 250 },
      },
    });
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 5, variantId: null, quantity: 1 }));
    const state = store.getState().cart;
    expect(state.items.length).toBeGreaterThan(0);
    expect(state.lastAction).toBe('added');
  });
});
