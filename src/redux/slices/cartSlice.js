/**
 * Cart Slice — PracticaYoruba
 *
 * Maneja:
 *   - Items del carrito (producto + variante + cantidad)
 *   - Totales calculados (subtotal, descuento, IVA, total)
 *   - Voucher aplicado
 *   - Sincronización con el backend
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

// ─── Thunks ───────────────────────────────────────────────────────────

export const fetchCart = createAsyncThunk(
  'cart/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/cart/');
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addItem',
  async ({ productId, variantId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const res = await apiService.post('/api/cart/items/', {
        product_id: productId,
        variant_id: variantId,
        quantity,
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateCartItem = createAsyncThunk(
  'cart/updateItem',
  async ({ itemId, quantity }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(`/api/cart/items/${itemId}/`, { quantity });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (itemId, { rejectWithValue }) => {
    try {
      await apiService.delete(`/api/cart/items/${itemId}/`);
      return itemId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const applyVoucher = createAsyncThunk(
  'cart/applyVoucher',
  async (code, { rejectWithValue }) => {
    try {
      const res = await apiService.post('/api/cart/voucher/', { code });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const removeVoucher = createAsyncThunk(
  'cart/removeVoucher',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.delete('/api/cart/voucher/');
      return null;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
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
    itemCount:  0,
    isLoading:  false,
    error:      null,
  },
  reducers: {
    clearCart(state) {
      state.items    = [];
      state.voucher  = null;
      state.totals   = { subtotal: 0, discount: 0, tax: 0, total: 0 };
      state.itemCount = 0;
    },
  },
  extraReducers: (builder) => {
    const setCart = (state, action) => {
      const cart = action.payload;
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
      .addCase(addToCart.pending,  (state) => { state.isLoading = true; })
      .addCase(addToCart.fulfilled, setCart)
      .addCase(addToCart.rejected,  (state, a) => {
        state.isLoading = false;
        state.error = a.payload;
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
      .addCase(applyVoucher.rejected,  (state, a) => { state.error = a.payload; })
      .addCase(removeVoucher.fulfilled, setCart);
  },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
