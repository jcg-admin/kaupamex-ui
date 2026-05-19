/**
 * Cart Slice — PracticaYoruba
 *
 * UC-CART-01: Agregar producto al carrito (anonimo + autenticado).
 *
 * Maneja:
 *   - Items del carrito (producto + variante + cantidad)
 *   - Totales calculados (subtotal, descuento, IVA, total)
 *   - Voucher / cupon aplicado
 *   - Estado por accion (lastAction, isActioning, actionError) para UI
 *
 * API endpoints (English keys per DEC-DOC-005):
 *   GET    /api/cart/            — leer carrito
 *   POST   /api/cart/items/      — agregar producto (UC-CART-01)
 *   PATCH  /api/cart/items/:id/  — cambiar cantidad
 *   DELETE /api/cart/items/:id/  — eliminar item
 *   POST   /api/cart/voucher/    — aplicar cupon
 *   DELETE /api/cart/voucher/    — quitar cupon
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// ─── Endpoints ────────────────────────────────────────────────────────
const CART_URL          = '/api/cart/';
const CART_ITEMS_URL    = '/api/cart/items/';
const CART_ITEM_URL     = (id) => `/api/cart/items/${id}/`;
const CART_VOUCHER_URL  = '/api/cart/voucher/';
const CART_SAVE_URL     = '/api/cart/save/';
const CART_SYNC_URL     = '/api/cart/sync/';

// ─── Thunks ───────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get(CART_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const addToCart = createAsyncThunk(
  'cart/addItem',
  async ({ productId, variantId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(CART_ITEMS_URL, {
        product_id: productId,
        variant_id: variantId,
        quantity,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(CART_ITEM_URL(itemId), { quantity });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await apiService.delete(CART_ITEM_URL(itemId));
      return itemId;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const applyVoucher = createAsyncThunk(
  'cart/applyVoucher',
  async (code, { rejectWithValue }) => {
    try {
      const res = await apiService.post(CART_VOUCHER_URL, { code });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const removeVoucher = createAsyncThunk(
  'cart/removeVoucher',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.delete(CART_VOUCHER_URL);
      return null;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CART-05 — guardar carrito para mas tarde (requiere auth). */
export const saveCartForLater = createAsyncThunk(
  'cart/saveForLater',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.post(CART_SAVE_URL, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CART-06 — sincronizar (fusionar) carrito anonimo al autenticar. */
export const syncCartOnLogin = createAsyncThunk(
  'cart/sync',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.post(CART_SYNC_URL, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

// ─── Helpers ──────────────────────────────────────────────────────────

const calculateTotals = (items, voucher, taxRate = 0.16) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = voucher
    ? voucher.type === 'PERCENT'
      ? subtotal * (voucher.value / 100)
      : Math.min(voucher.value, subtotal)
    : 0;
  const taxable  = subtotal - discount;
  const tax      = taxable * taxRate;
  const total    = taxable + tax;
  return { subtotal, discount, tax, total };
};

// ─── Slice ────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items:     [],
    voucher:   null,
    totals: {
      subtotal: 0,
      discount: 0,
      tax:      0,
      total:    0,
    },
    itemCount:   0,
    isLoading:   false,
    error:       null,
    isActioning: false,
    actionError: null,
    lastAction:  null,
  },
  reducers: {
    clearCart(state) {
      state.items    = [];
      state.voucher  = null;
      state.totals   = { subtotal: 0, discount: 0, tax: 0, total: 0 };
      state.itemCount = 0;
    },
    clearCartActionState(state) {
      state.isActioning = false;
      state.actionError = null;
      state.lastAction  = null;
    },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      const cart = action.payload ?? {};
      state.items    = cart.items ?? [];
      state.voucher  = cart.voucher ?? null;
      state.totals   = calculateTotals(state.items, state.voucher);
      state.itemCount = state.items.reduce((n, i) => n + i.quantity, 0);
      state.isLoading = false;
      state.error    = null;
    };

    builder
      .addCase(fetchCart.pending,  (state) => { state.isLoading = true; })
      .addCase(fetchCart.fulfilled, setCart)
      .addCase(fetchCart.rejected,  (state, a) => {
        state.isLoading = false;
        state.error = a.payload;
      });

    builder
      .addCase(addToCart.pending,  (state) => {
        state.isLoading   = true;
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        setCart(state, action);
        state.isActioning = false;
        state.lastAction  = 'added';
      })
      .addCase(addToCart.rejected,  (state, a) => {
        state.isLoading   = false;
        state.isActioning = false;
        state.actionError = a.payload;
        state.error       = a.payload;
      });

    builder
      .addCase(updateCartItem.fulfilled, setCart)
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.items     = state.items.filter((i) => i.id !== action.payload);
        state.totals    = calculateTotals(state.items, state.voucher);
        state.itemCount = state.items.reduce((n, i) => n + i.quantity, 0);
      });

    builder
      .addCase(applyVoucher.fulfilled, setCart)
      .addCase(applyVoucher.rejected,  (state, a) => {
        state.actionError = a.payload;
      })
      .addCase(removeVoucher.fulfilled, setCart);

    builder
      .addCase(saveCartForLater.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(saveCartForLater.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'saved';
      })
      .addCase(saveCartForLater.rejected, (state, a) => {
        state.isActioning = false;
        state.actionError = a.payload;
      });

    builder
      .addCase(syncCartOnLogin.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(syncCartOnLogin.fulfilled, (state, action) => {
        setCart(state, action);
        state.isActioning = false;
        state.lastAction  = 'synced';
      })
      .addCase(syncCartOnLogin.rejected, (state, a) => {
        state.isActioning = false;
        state.actionError = a.payload;
      });
  },
});

export const { clearCart, clearCartActionState } = cartSlice.actions;
export default cartSlice.reducer;
