/**
 * Tests — cartSlice (canonical pattern with serializeApiError).
 * UC-CART-01: agregar producto al carrito.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { configureStore } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import cartReducer, {
  addToCart,
  syncCartOnLogin,
  clearCartActionState,
} from './cartSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { cart: cartReducer } });

afterEach(() => apiService.clearCartToken());

describe('cartSlice (UC-CART-01)', () => {
  it('addToCart: hace POST /api/cart/items/ con product_id, variant_id, quantity', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ items: [], voucher: null });
      }),
    );
    const store = makeStore();

    await store.dispatch(addToCart({ productId: 4321, variantId: 87, quantity: 2 }));

    expect(lastBody).toMatchObject({ product_id: 4321, variant_id: 87, quantity: 2 });
  });

  it('addToCart: marca lastAction=added en estado tras exito', async () => {
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, () =>
        HttpResponse.json({
          items: [{ id: 1, product_id: 4321, name: 'Test', price: 100, quantity: 1 }],
          voucher: null,
        }),
      ),
    );
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 4321, variantId: null, quantity: 1 }));

    const state = store.getState().cart;
    expect(state.lastAction).toBe('added');
    expect(state.isActioning).toBe(false);
    expect(state.items).toHaveLength(1);
  });

  it('addToCart: en error, guarda actionError serializado (message+code)', async () => {
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, () =>
        HttpResponse.json(
          { detail: 'Sin stock disponible.', codigo_error: 'SIN_STOCK' },
          { status: 400 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 4321, variantId: null, quantity: 1 }));

    const state = store.getState().cart;
    expect(state.actionError).toMatchObject({
      message: 'Sin stock disponible.',
      statusCode: 400,
    });
    expect(state.isActioning).toBe(false);
  });

  it('UC-CART-06 — syncCartOnLogin: envia el cart_token anonimo y fusiona', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/cart/merges/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({
          items: [
            { id: 1, product_id: 10, name: 'Anonimo', price: 100, quantity: 1 },
            { id: 2, product_id: 20, name: 'Cuenta',  price: 50,  quantity: 2 },
          ],
          voucher: null,
        });
      }),
    );
    apiService.setCartToken('anon-tok-123');
    const store = makeStore();
    await store.dispatch(syncCartOnLogin());

    // CR-1: el body lleva el cart_token (antes iba vacio -> 400 en backend).
    expect(lastBody).toEqual({ cart_token: 'anon-tok-123' });
    // CR-2: tras fusionar, el token anonimo se limpia (ya no se reenvia).
    expect(apiService.getCartToken()).toBeNull();
    const state = store.getState().cart;
    expect(state.items).toHaveLength(2);
    expect(state.lastAction).toBe('synced');
    expect(state.itemCount).toBe(3);
  });

  it('UC-CART-06 — syncCartOnLogin: sin carrito anonimo NO hace POST', async () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/v2/cart/merges/`, async () => {
        called = true;
        return HttpResponse.json({ items: [], voucher: null });
      }),
    );
    const store = makeStore();               // sin cart token
    const result = await store.dispatch(syncCartOnLogin());

    expect(called).toBe(false);
    expect(result.type).toBe('cart/sync/rejected');
  });

  it('UC-CART-06 — syncCartOnLogin: en error guarda actionError serializado', async () => {
    server.use(
      http.post(`${BASE}/api/v2/cart/merges/`, () =>
        HttpResponse.json(
          { detail: 'Error al fusionar', codigo_error: 'FUSION_ERROR' },
          { status: 400 },
        ),
      ),
    );
    apiService.setCartToken('anon-tok-err');
    const store = makeStore();
    await store.dispatch(syncCartOnLogin());
    const state = store.getState().cart;
    expect(state.actionError).toMatchObject({
      message: 'Error al fusionar',
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
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, () =>
        HttpResponse.json({
          items: [{ id: 1, product_id: 10, name: 'P', price: 1000, quantity: 1 }],
          voucher: null,
          totals: { subtotal: 1000, discount: 0, tax: 100, total: 1100 },
        }),
      ),
    );
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

    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, () =>
        HttpResponse.json({
          items: [{ id: 1 }],
          voucher: null,
          totals: { subtotal: 100, discount: 0, tax: 10, total: 110 },
        }),
      ),
    );
    await store.dispatch(addToCart({ productId: 1, variantId: null, quantity: 1 }));
    expect(store.getState().cart.totals.tax).toBe(10);

    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, () =>
        HttpResponse.json({
          items: [{ id: 1 }],
          voucher: null,
          totals: { subtotal: 100, discount: 0, tax: 16, total: 116 },
        }),
      ),
    );
    await store.dispatch(addToCart({ productId: 1, variantId: null, quantity: 1 }));
    expect(store.getState().cart.totals.tax).toBe(16);
    expect(store.getState().cart.totals.total).toBe(116);
  });

  // T-309 — DEC-BC-08: items persisten en estado tras addToCart exitoso.
  it('cart_item_added_state_persists: items.length > 0 tras addToCart exitoso', async () => {
    server.use(
      http.post(`${BASE}/api/v2/cart/items/`, () =>
        HttpResponse.json({
          items: [{ id: 1, product_id: 5, name: 'Pulcera', price: 250, quantity: 1 }],
          voucher: null,
          totals: { subtotal: 250, discount: 0, tax: 0, total: 250 },
        }),
      ),
    );
    const store = makeStore();
    await store.dispatch(addToCart({ productId: 5, variantId: null, quantity: 1 }));
    const state = store.getState().cart;
    expect(state.items.length).toBeGreaterThan(0);
    expect(state.lastAction).toBe('added');
  });
});
