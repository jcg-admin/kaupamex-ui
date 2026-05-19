/**
 * Tests — wishlistSlice (UC-WISH-01..03)
 * Patron canonico D-010: errores tipados via serializeApiError.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(),
    patch: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';

import wishlistReducer, {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  moveWishlistItemToCart,
  clearWishlistActionState,
} from './wishlistSlice';

class APIError extends Error {
  constructor({ message, code, statusCode, validationErrors, body }) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.statusCode = statusCode;
    this.validationErrors = validationErrors;
    this.body = body;
  }
}

const makeStore = () =>
  configureStore({ reducer: { wishlist: wishlistReducer } });

afterEach(() => jest.clearAllMocks());

describe('wishlistSlice — UC-WISH-01..03', () => {
  it('fetchWishlist.fulfilled popula items (UC-WISH-02)', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ id: 1, product_id: 7 }] },
    });
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    expect(store.getState().wishlist.items).toEqual([
      { id: 1, product_id: 7 },
    ]);
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/wishlist/',
      expect.objectContaining({ params: {} }),
    );
  });

  it('fetchWishlist.rejected preserva statusCode (UC-WISH-02)', async () => {
    apiService.get.mockRejectedValue(new APIError({
      message: 'no autenticado', code: 'UNAUTHENTICATED', statusCode: 401,
    }));
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    expect(store.getState().wishlist.error).toMatchObject({
      code: 'UNAUTHENTICATED', statusCode: 401,
    });
  });

  it('addToWishlist.fulfilled agrega item al inicio (UC-WISH-01)', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, product_id: 7 },
    });
    const store = makeStore();
    await store.dispatch(addToWishlist({ productId: 7 }));
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/wishlist/',
      { product_id: 7 },
    );
    expect(store.getState().wishlist.items[0]).toEqual({
      id: 99, product_id: 7,
    });
    expect(store.getState().wishlist.lastAction).toBe('added');
  });

  it('addToWishlist envia variant_id cuando se pasa (UC-WISH-01)', async () => {
    apiService.post.mockResolvedValue({ data: { id: 1 } });
    const store = makeStore();
    await store.dispatch(addToWishlist({ productId: 7, variantId: 3 }));
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/wishlist/',
      { product_id: 7, variant_id: 3 },
    );
  });

  it('addToWishlist.rejected preserva code y validationErrors (UC-WISH-01)', async () => {
    apiService.post.mockRejectedValue(new APIError({
      message: 'ya en la lista',
      code: 'PRODUCTO_YA_EN_WISHLIST',
      statusCode: 409,
    }));
    const store = makeStore();
    await store.dispatch(addToWishlist({ productId: 7 }));
    expect(store.getState().wishlist.actionError).toMatchObject({
      code: 'PRODUCTO_YA_EN_WISHLIST',
      statusCode: 409,
    });
  });

  it('removeFromWishlist.fulfilled elimina del state (UC-WISH-02)', async () => {
    apiService.get.mockResolvedValue({
      data: [{ id: 1 }, { id: 2 }],
    });
    apiService.delete.mockResolvedValue({});
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    await store.dispatch(removeFromWishlist(1));
    expect(store.getState().wishlist.items).toEqual([{ id: 2 }]);
    expect(store.getState().wishlist.lastAction).toBe('removed');
  });

  it('moveWishlistItemToCart.fulfilled elimina por defecto (UC-WISH-03)', async () => {
    apiService.get.mockResolvedValue({ data: [{ id: 5 }] });
    apiService.post.mockResolvedValue({ data: { cart: {} } });
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    await store.dispatch(moveWishlistItemToCart({ itemId: 5 }));
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/wishlist/5/move-to-cart/',
      { quantity: 1, keep_in_wishlist: false },
    );
    expect(store.getState().wishlist.items).toEqual([]);
    expect(store.getState().wishlist.lastAction).toBe('moved');
  });

  it('moveWishlistItemToCart con keepInWishlist mantiene el item (UC-WISH-03)', async () => {
    apiService.get.mockResolvedValue({ data: [{ id: 5 }] });
    apiService.post.mockResolvedValue({ data: {} });
    const store = makeStore();
    await store.dispatch(fetchWishlist());
    await store.dispatch(moveWishlistItemToCart({
      itemId: 5, keepInWishlist: true,
    }));
    expect(store.getState().wishlist.items).toEqual([{ id: 5 }]);
  });

  it('moveWishlistItemToCart.rejected preserva code (UC-WISH-03)', async () => {
    apiService.post.mockRejectedValue(new APIError({
      message: 'sin stock', code: 'PRODUCTO_SIN_STOCK', statusCode: 409,
    }));
    const store = makeStore();
    await store.dispatch(moveWishlistItemToCart({ itemId: 5 }));
    expect(store.getState().wishlist.actionError).toMatchObject({
      code: 'PRODUCTO_SIN_STOCK', statusCode: 409,
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
