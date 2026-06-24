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
 * Lecturas (listado, detalle):
 *   fetchOrders      — GET /api/v1/orders/?status={filter}
 *   fetchOrderDetail — GET /api/v1/orders/{order_number}/
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const CHECKOUT_URL              = '/api/v1/orders/checkout/';  // F6 Tier B — awaiting v2
const CANCEL_URL                = (orderNumber) => `/api/v2/orders/${orderNumber}/cancellations/`;
const ADDRESS_URL               = (orderNumber) => `/api/v2/orders/${orderNumber}/shipping-address/`;
const SHIPPING_URL              = (orderNumber) => `/api/v2/orders/${orderNumber}/shipping-method/`;
const ADMIN_STATUS_URL          = (orderNumber) => `/api/v2/admin/orders/${orderNumber}/status/`;
const ADMIN_CANCEL_URL          = (orderNumber) => `/api/v2/admin/orders/${orderNumber}/cancel/`;
const ORDERS_URL                = '/api/v2/orders/';
const ORDER_DETAIL_URL          = (orderNumber) => `/api/v2/orders/${orderNumber}/`;

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

/** Lista de pedidos del comprador con filtro opcional de estado y soporte de paginación.
 *  H-CICLO22-02: se agrega el parámetro `page` para poder navegar páginas y se
 *  preservan count/next/previous en el estado para que la UI pueda renderizar
 *  controles de paginación. Sin `page`, el thunk siempre retornaba la página 1
 *  y el slice descartaba los metadatos de paginación. */
export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async ({ filter = 'all', page = 1, pageSize } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (filter !== 'all') params.status = filter;
      if (page > 1) params.page = page;
      if (pageSize) params.page_size = pageSize;
      const res = await apiService.get(ORDERS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** Detalle de una orden por numero de orden. */
export const fetchOrderDetail = createAsyncThunk(
  'orders/fetchOrderDetail',
  async (orderNumber, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ORDER_DETAIL_URL(orderNumber));
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
  list:            [],
  // H-CICLO22-02: metadatos de paginación preservados del response de la API.
  // La API devuelve {count, next, previous, results}. Sin estos campos la UI
  // no podía mostrar controles de paginación ni saber si hay más páginas.
  ordersCount:     0,
  ordersNext:      null,
  ordersPrevious:  null,
  current:         null,
  isLoading:       false,
  isLoadingDetail: false,
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
    resetOrdersList(state) {
      state.list           = [];
      state.ordersCount    = 0;
      state.ordersNext     = null;
      state.ordersPrevious = null;
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
      .addCase(adminCancelOrder.rejected,  handleRejected)

      .addCase(fetchOrders.pending, (state) => {
        state.isLoading  = true;
        state.actionError = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        // H-CICLO22-02: preservar metadatos de paginación del response.
        // La API usa PageNumberPagination y devuelve {count, next, previous, results}.
        const payload = action.payload;
        if (payload && typeof payload === 'object' && 'results' in payload) {
          state.list           = payload.results;
          state.ordersCount    = payload.count    ?? 0;
          state.ordersNext     = payload.next     ?? null;
          state.ordersPrevious = payload.previous ?? null;
        } else {
          // Fallback para respuestas planas (sin paginar).
          state.list           = Array.isArray(payload) ? payload : [];
          state.ordersCount    = state.list.length;
          state.ordersNext     = null;
          state.ordersPrevious = null;
        }
        state.isLoading = false;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.isLoading  = false;
        state.actionError = action.payload;
      })

      .addCase(fetchOrderDetail.pending, (state) => {
        state.isLoadingDetail = true;
        state.current         = null;
        // Limpiar actionError para que un error de carga previo no contamine
        // la vista de detalle ni los mensajes de error de mutaciones.
        state.actionError     = null;
      })
      .addCase(fetchOrderDetail.fulfilled, (state, action) => {
        state.current         = action.payload;
        state.isLoadingDetail = false;
      })
      .addCase(fetchOrderDetail.rejected, (state, action) => {
        state.isLoadingDetail = false;
        state.actionError     = action.payload;
      });
  },
});

export const { clearOrdersActionState, resetOrdersList } = ordersSlice.actions;
export default ordersSlice.reducer;
