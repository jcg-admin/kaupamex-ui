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
 *   GET    /api/v1/cart/            — leer carrito
 *   POST /api/v1/cart/items/      — agregar producto (UC-CART-01)
 *   PATCH /api/v1/cart/items/:id/  — cambiar cantidad
 *   DELETE /api/v1/cart/items/:id/  — eliminar item
 *   POST /api/v1/cart/voucher/    — aplicar cupon
 *   DELETE /api/v1/cart/voucher/    — quitar cupon
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// ─── Endpoints ────────────────────────────────────────────────────────
const CART_URL          = '/api/v1/cart/';
const CART_ITEMS_URL    = '/api/v1/cart/items/';
const CART_ITEM_URL     = (id) => `/api/v1/cart/items/${id}/`;
const CART_VOUCHER_URL  = '/api/v1/cart/voucher/';
const CART_SAVE_URL     = '/api/v1/cart/save/';
const CART_SYNC_URL     = '/api/v1/cart/merge/';

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
      // DEC-BC-02 + DEC-BC-08: backend DELETE devuelve Cart actualizado
      // (status 200) con totals. UI usa setCart consistentemente.
      const res = await apiService.delete(CART_ITEM_URL(itemId));
      return res.data;
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

// ─── Slice ────────────────────────────────────────────────────────────
// DEC-BC-02 + DEC-BC-08 (consolidadas, 2026-05-21): el UI ya NO
// calcula totales localmente. Todas las cart mutations devuelven
// Cart completo con `totals` desde el backend (apps/cart/views.py).
// Eliminar el helper calculateTotals previene drift silencioso si
// el backend cambia la politica de IVA (exencion, geografia, etc.).

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
      // DEC-BC-02 + DEC-BC-08: totals vienen del backend (CartSerializer).
      // Backend serializa Decimal como strings + usa `tax_included`
      // (per DEC-BC-05 IVA incluido). UI coerce a numbers y mapea
      // `tax_included` -> `tax` para el shape que la pagina consume
      // con .toFixed(). NUNCA recalcular localmente (drift fiscal).
      const t = cart.totals ?? {};
      state.totals = {
        subtotal: Number(t.subtotal) || 0,
        discount: Number(t.discount) || 0,
        tax:      Number(t.tax_included ?? t.tax) || 0,
        total:    Number(t.total) || 0,
      };
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
      // H-CICLO47-02: updateCartItem y removeCartItem carecían de handlers
      // .pending y .rejected — isActioning nunca se activaba y un actionError
      // previo permanecía visible mientras el usuario actualizaba/eliminaba
      // un item del carrito.
      .addCase(updateCartItem.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        setCart(state, action);
        state.isActioning = false;
        state.lastAction  = 'updated';
      })
      .addCase(updateCartItem.rejected, (state, a) => {
        state.isActioning = false;
        state.actionError = a.payload;
      })
      // DEC-BC-08: backend DELETE devuelve Cart actualizado (200);
      // setCart sustituye el filter+recalculo local.
      .addCase(removeCartItem.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        setCart(state, action);
        state.isActioning = false;
        state.lastAction  = 'removed';
      })
      .addCase(removeCartItem.rejected, (state, a) => {
        state.isActioning = false;
        state.actionError = a.payload;
      });

    builder
      // H-CICLO47-02: applyVoucher.pending no limpiaba actionError — si una
      // aplicación anterior fallaba, el error permanecía visible al reintentar
      // con un cupón distinto hasta que el nuevo resultado llegaba.
      .addCase(applyVoucher.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(applyVoucher.fulfilled, (state, action) => {
        setCart(state, action);
        state.isActioning = false;
        state.lastAction  = 'voucher_applied';
      })
      .addCase(applyVoucher.rejected,  (state, a) => {
        state.isActioning = false;
        state.actionError = a.payload;
      })
      .addCase(removeVoucher.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(removeVoucher.fulfilled, (state, action) => {
        setCart(state, action);
        state.isActioning = false;
        state.lastAction  = 'voucher_removed';
      })
      .addCase(removeVoucher.rejected, (state, a) => {
        state.isActioning = false;
        state.actionError = a.payload;
      });

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
