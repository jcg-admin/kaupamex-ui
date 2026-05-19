/**
 * wishlistSlice — PracticaYoruba
 * Gestion de la lista de deseos del comprador (UC-WISH-01..03)
 *
 *   UC-WISH-01 — Agregar producto a la lista de deseos
 *   UC-WISH-02 — Ver lista de deseos
 *   UC-WISH-03 — Mover producto de la lista al carrito
 *
 * Patron canonico (D-010):
 *   - Lecturas (UC-WISH-02) consumibles tambien via `useWishlist` (React Query)
 *   - Mutaciones (add / remove / move-to-cart) en este slice
 *   - Errores tipados via `serializeApiError`
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const WISHLIST_URL      = '/api/v1/wishlist/';
const WISHLIST_ITEM_URL = (itemId) => `/api/v1/wishlist/${itemId}/`;
const MOVE_TO_CART_URL  = (itemId) => `/api/v1/wishlist/${itemId}/move-to-cart/`;

// =============================================================================
// Thunks
// =============================================================================

/** UC-WISH-02: lista los WishlistItem del comprador autenticado. */
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(WISHLIST_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-WISH-01: agrega un producto (con variante opcional) a la lista. */
export const addToWishlist = createAsyncThunk(
  'wishlist/addToWishlist',
  async ({ productId, variantId = null }, { rejectWithValue }) => {
    try {
      const payload = { product_id: productId };
      if (variantId != null) payload.variant_id = variantId;
      const res = await apiService.post(WISHLIST_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-WISH-02 (accion en la lista): elimina un item de la wishlist. */
export const removeFromWishlist = createAsyncThunk(
  'wishlist/removeFromWishlist',
  async (itemId, { rejectWithValue }) => {
    try {
      await apiService.delete(WISHLIST_ITEM_URL(itemId));
      return { id: itemId };
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-WISH-03: mueve un item al carrito (con flag mantener_en_lista opcional). */
export const moveWishlistItemToCart = createAsyncThunk(
  'wishlist/moveToCart',
  async ({ itemId, quantity = 1, keepInWishlist = false }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(MOVE_TO_CART_URL(itemId), {
        quantity,
        keep_in_wishlist: keepInWishlist,
      });
      return { id: itemId, keepInWishlist, data: res.data };
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

// =============================================================================
// Slice
// =============================================================================

const initialState = {
  items:       [],
  isLoading:   false,
  isActioning: false,
  error:       null,
  actionError: null,
  lastAction:  null, // 'added' | 'removed' | 'moved'
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,

  reducers: {
    clearWishlistActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        const results = payload.results ?? payload.items ?? payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.isLoading = false;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      .addCase(addToWishlist.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'added';
        if (action.payload) state.items.unshift(action.payload);
      })
      .addCase(addToWishlist.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(removeFromWishlist.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'removed';
        const id = action.payload?.id;
        if (id != null) state.items = state.items.filter((i) => i.id !== id);
      })
      .addCase(removeFromWishlist.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(moveWishlistItemToCart.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(moveWishlistItemToCart.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'moved';
        const { id, keepInWishlist } = action.payload;
        if (!keepInWishlist && id != null) {
          state.items = state.items.filter((i) => i.id !== id);
        }
      })
      .addCase(moveWishlistItemToCart.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearWishlistActionState } = wishlistSlice.actions;
export default wishlistSlice.reducer;
