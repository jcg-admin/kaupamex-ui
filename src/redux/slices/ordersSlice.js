/**
 * Orders Slice — PracticaYoruba
 * Historial de órdenes del comprador autenticado
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

export const fetchOrders = createAsyncThunk(
  'orders/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/orders/', { params });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchOrder = createAsyncThunk(
  'orders/fetchOne',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`/api/orders/${orderId}/`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`/api/orders/${orderId}/cancel/`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    orders:       [],
    currentOrder: null,
    pagination:   { count: 0, page: 1, totalPages: 0 },
    isLoading:    false,
    error:        null,
  },
  reducers: {
    clearCurrentOrder(state) { state.currentOrder = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending,   (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        const { results, count } = action.payload;
        state.orders    = results ?? action.payload;
        state.pagination.count = count ?? state.orders.length;
        state.pagination.totalPages = Math.ceil((count ?? 0) / 10);
        state.isLoading = false;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchOrder.pending,   (state) => { state.isLoading = true; })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.currentOrder = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    builder.addCase(cancelOrder.fulfilled, (state, action) => {
      const updated = action.payload;
      const idx = state.orders.findIndex((o) => o.id === updated.id);
      if (idx !== -1) state.orders[idx] = updated;
      if (state.currentOrder?.id === updated.id) state.currentOrder = updated;
    });
  },
});

export const { clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
