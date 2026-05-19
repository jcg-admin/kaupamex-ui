/**
 * ordersSlice — PracticaYoruba
 *
 * Mutaciones del dominio Orders:
 *   UC-ORD-01 — Checkout (crear orden desde carrito)
 *   UC-ORD-04 — Cancelar orden (comprador)
 *   UC-ORD-05 — Editar direccion de orden (comprador)
 *   UC-ORD-06 — Cambiar metodo de envio (comprador)
 *   UC-ORD-07 — Transicion de estado (admin)
 *   UC-ORD-08 — Cancelar orden (admin)
 *
 * Lecturas (listado, detalle, dashboard) viven en
 * `src/hooks/domain/useOrders.js` via React Query.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const CHECKOUT_URL              = '/api/v1/checkout/';
const CANCEL_URL                = (orderNumber) => `/api/v1/orders/${orderNumber}/cancel/`;
const ADDRESS_URL               = (orderNumber) => `/api/v1/orders/${orderNumber}/address/`;
const SHIPPING_URL              = (orderNumber) => `/api/v1/orders/${orderNumber}/shipping/`;
const ADMIN_STATUS_URL          = (orderNumber) => `/api/v1/admin/orders/${orderNumber}/status/`;
const ADMIN_CANCEL_URL          = (orderNumber) => `/api/v1/admin/orders/${orderNumber}/cancel/`;

// =============================================================================
// Thunks
// =============================================================================

/** UC-ORD-01: crea una orden desde el carrito activo. */
export const checkoutOrder = createAsyncThunk(
  'orders/checkout',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.post(CHECKOUT_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-ORD-04: comprador cancela una orden. */
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async ({ orderNumber, reason }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(CANCEL_URL(orderNumber), { reason: reason || '' });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-ORD-05: comprador edita la direccion de la orden. */
export const updateOrderAddress = createAsyncThunk(
  'orders/updateAddress',
  async ({ orderNumber, address }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(ADDRESS_URL(orderNumber), address);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-ORD-06: comprador cambia el metodo de envio. */
export const updateOrderShipping = createAsyncThunk(
  'orders/updateShipping',
  async ({ orderNumber, shippingMethodId }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(SHIPPING_URL(orderNumber), {
        shipping_method_id: shippingMethodId,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-ORD-07: admin transiciona el estado de la orden. */
export const adminTransitionOrderStatus = createAsyncThunk(
  'orders/adminTransition',
  async ({ orderNumber, newStatus, notes }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(ADMIN_STATUS_URL(orderNumber), {
        new_status: newStatus,
        notes:      notes || '',
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-ORD-08: admin cancela una orden. */
export const adminCancelOrder = createAsyncThunk(
  'orders/adminCancel',
  async ({ orderNumber, reason }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_CANCEL_URL(orderNumber), { reason });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

// =============================================================================
// Slice
// =============================================================================

const initialState = {
  isActioning:     false,
  actionError:     null,
  lastAction:      null, // 'checkout' | 'cancelled' | 'address_updated' | 'shipping_updated' | 'admin_transitioned' | 'admin_cancelled'
  lastOrderNumber: null,
  lastOrder:       null,
};

const handlePending = (state) => {
  state.isActioning = true;
  state.actionError = null;
};

const makeFulfilled = (label) => (state, action) => {
  state.isActioning     = false;
  state.lastAction      = label;
  state.lastOrder       = action.payload ?? null;
  state.lastOrderNumber = action.payload?.order_number ?? state.lastOrderNumber;
};

const handleRejected = (state, action) => {
  state.isActioning = false;
  state.actionError = action.payload ?? { message: 'Error inesperado.' };
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrdersActionState(state) {
      state.actionError     = null;
      state.lastAction      = null;
      state.lastOrderNumber = null;
      state.lastOrder       = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkoutOrder.pending,   handlePending)
      .addCase(checkoutOrder.fulfilled, makeFulfilled('checkout'))
      .addCase(checkoutOrder.rejected,  handleRejected)

      .addCase(cancelOrder.pending,     handlePending)
      .addCase(cancelOrder.fulfilled,   makeFulfilled('cancelled'))
      .addCase(cancelOrder.rejected,    handleRejected)

      .addCase(updateOrderAddress.pending,   handlePending)
      .addCase(updateOrderAddress.fulfilled, makeFulfilled('address_updated'))
      .addCase(updateOrderAddress.rejected,  handleRejected)

      .addCase(updateOrderShipping.pending,   handlePending)
      .addCase(updateOrderShipping.fulfilled, makeFulfilled('shipping_updated'))
      .addCase(updateOrderShipping.rejected,  handleRejected)

      .addCase(adminTransitionOrderStatus.pending,   handlePending)
      .addCase(adminTransitionOrderStatus.fulfilled, makeFulfilled('admin_transitioned'))
      .addCase(adminTransitionOrderStatus.rejected,  handleRejected)

      .addCase(adminCancelOrder.pending,   handlePending)
      .addCase(adminCancelOrder.fulfilled, makeFulfilled('admin_cancelled'))
      .addCase(adminCancelOrder.rejected,  handleRejected);
  },
});

export const { clearOrdersActionState } = ordersSlice.actions;
export default ordersSlice.reducer;
