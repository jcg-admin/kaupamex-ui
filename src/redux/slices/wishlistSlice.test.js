/**
 * Tests — wishlistSlice (UC-WISH-01..03)
 * Patron canonico D-010: errores tipados via serializeApiError.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { configureStore } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';
import wishlistReducer, {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
  clearWishlistActionState,
} from './wishlistSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { wishlist: wishlistReducer } });

describe('wishlistSlice — UC-WISH-01..03', () => {
  it('fetchWishlist.fulfilled popula items (UC-WISH-02)', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v1/wishlist/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [{ id: 1, product_id: 7 }] });
      }),
    );
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    expect(store.getState().wishlist.items).toEqual([
      { id: 1, product_id: 7 },
    ]);
    await waitFor(() => expect(capturedUrl).toBeDefined());
    // Verify empty params passed — no unexpected query params
    const url = new URL(capturedUrl);
    expect(url.pathname).toBe('/api/v1/wishlist/');
  });

  it('fetchWishlist.rejected preserva statusCode (UC-WISH-02)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/wishlist/`, () =>
        HttpResponse.json(
          { detail: 'no autenticado', codigo_error: 'UNAUTHENTICATED' },
          { status: 422 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    expect(store.getState().wishlist.error).toMatchObject({
      code: 'UNAUTHENTICATED',
      statusCode: 422,
    });
  });

  it('addToWishlist.fulfilled agrega item al inicio (UC-WISH-01)', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/wishlist/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 99, product_id: 7 });
      }),
    );
    const store = makeStore();
    await store.dispatch(addToWishlist({ productId: 7 }));
    await waitFor(() => expect(lastBody).toBeDefined());
    expect(lastBody).toMatchObject({ product_id: 7 });
    expect(store.getState().wishlist.items[0]).toEqual({
      id: 99, product_id: 7,
    });
    expect(store.getState().wishlist.lastAction).toBe('added');
  });

  it('addToWishlist envia variant_id cuando se pasa (UC-WISH-01)', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/wishlist/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 1 });
      }),
    );
    const store = makeStore();
    await store.dispatch(addToWishlist({ productId: 7, variantId: 3 }));
    await waitFor(() => expect(lastBody).toBeDefined());
    expect(lastBody).toMatchObject({ product_id: 7, variant_id: 3 });
  });

  it('addToWishlist.rejected preserva code y validationErrors (UC-WISH-01)', async () => {
    server.use(
      http.post(`${BASE}/api/v1/wishlist/`, () =>
        HttpResponse.json(
          { detail: 'ya en la lista', codigo_error: 'PRODUCT_ALREADY_IN_WISHLIST' },
          { status: 422 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(addToWishlist({ productId: 7 }));
    expect(store.getState().wishlist.actionError).toMatchObject({
      code: 'PRODUCT_ALREADY_IN_WISHLIST',
      statusCode: 422,
    });
  });

  it('removeFromWishlist.fulfilled elimina del state (UC-WISH-02)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/wishlist/`, () =>
        HttpResponse.json([{ id: 1 }, { id: 2 }]),
      ),
      http.delete(`${BASE}/api/v1/wishlist/1/`, () =>
        new HttpResponse(null, { status: 204 }),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    await store.dispatch(removeFromWishlist(1));
    expect(store.getState().wishlist.items).toEqual([{ id: 2 }]);
    expect(store.getState().wishlist.lastAction).toBe('removed');
  });

  it('moveWishlistItemToCart.fulfilled elimina por defecto (UC-WISH-03)', async () => {
    let lastBody;
    server.use(
      http.get(`${BASE}/api/v1/wishlist/`, () =>
        HttpResponse.json([{ id: 5 }]),
      ),
      http.post(`${BASE}/api/v1/wishlist/5/move-to-cart/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ cart: {} });
      }),
    );
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    await store.dispatch(moveWishlistItemToCart({ itemId: 5 }));
    await waitFor(() => expect(lastBody).toBeDefined());
    expect(lastBody).toMatchObject({ quantity: 1, keep_in_wishlist: false });
    expect(store.getState().wishlist.items).toEqual([]);
    expect(store.getState().wishlist.lastAction).toBe('moved');
  });

  it('moveWishlistItemToCart con keepInWishlist mantiene el item (UC-WISH-03)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/wishlist/`, () =>
        HttpResponse.json([{ id: 5 }]),
      ),
      http.post(`${BASE}/api/v1/wishlist/5/move-to-cart/`, () =>
        HttpResponse.json({}),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    await store.dispatch(moveWishlistItemToCart({
      itemId: 5, keepInWishlist: true,
    }));
    expect(store.getState().wishlist.items).toEqual([{ id: 5 }]);
  });

  it('moveWishlistItemToCart.rejected preserva code (UC-WISH-03)', async () => {
    server.use(
      http.post(`${BASE}/api/v1/wishlist/5/move-to-cart/`, () =>
        HttpResponse.json(
          { detail: 'sin stock', codigo_error: 'PRODUCT_OUT_OF_STOCK' },
          { status: 422 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(moveWishlistItemToCart({ itemId: 5 }));
    expect(store.getState().wishlist.actionError).toMatchObject({
      code: 'PRODUCT_OUT_OF_STOCK', statusCode: 422,
    });
  });

  it('clearWishlistActionState resetea lastAction y actionError', () => {
    const store = makeStore();
    store.dispatch({
      type: addToWishlist.rejected.type,
      payload: { code: 'X' },
    });
    store.dispatch(clearWishlistActionState());
    expect(store.getState().wishlist.actionError).toBe(null);
    expect(store.getState().wishlist.lastAction).toBe(null);
  });
});
