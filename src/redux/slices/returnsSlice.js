/**
 * returnsSlice — PracticaYoruba
 * Devoluciones: gestion del ciclo completo (comprador + admin).
 *
 *   UC-RET-01 — Solicitar devolucion (Comprador)
 *   UC-RET-02 — Revisar solicitud (Admin: aprobar/rechazar/solicitar info)
 *   UC-RET-03 — Registrar recepcion fisica (Admin)
 *   UC-RET-04 — Ver estado de devolucion (Comprador)
 *   UC-RET-05 — Bandeja de devoluciones pendientes (Admin)
 *   UC-RET-06 — Procesar reembolso (Admin)
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const CUSTOMER_URL = '/api/v1/returns/';
const ADMIN_URL    = '/api/v1/admin/returns/';

// =============================================================================
// Thunks — Comprador
// =============================================================================

/**
 * UC-RET-01: crea una nueva solicitud de devolucion.
 *
 * Acepta dos formas:
 *   - payload JSON (sin fotos): `{ order_id, reason, description }`.
 *   - payload con fotos (UC-RET-01 Alt A): `{ order_id, reason,
 *     description, photos: File[] }` — se serializa como `multipart/form-data`.
 *
 * Cuando hay fotos, el thunk arma un `FormData` con los campos planos +
 * cada `File` bajo la clave `photos`. apiService delega en axios, que
 * detecta el `FormData` y setea el `Content-Type` con el boundary
 * correcto.
 */
export const createReturnRequest = createAsyncThunk(
  'returns/create',
  async (payload, { rejectWithValue }) => {
    try {
      const photos = Array.isArray(payload?.photos) ? payload.photos : [];
      let body = payload;
      if (photos.length > 0) {
        const form = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (key === 'photos') return;
          if (value === undefined || value === null) return;
          form.append(key, value);
        });
        photos.forEach((file) => form.append('photos', file));
        body = form;
      }
      const res = await apiService.post(CUSTOMER_URL, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-04: listado de devoluciones del comprador autenticado. */
export const fetchCustomerReturns = createAsyncThunk(
  'returns/fetchCustomer',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(CUSTOMER_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-04: detalle de una devolucion del comprador. */
export const fetchCustomerReturnDetail = createAsyncThunk(
  'returns/fetchCustomerDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`${CUSTOMER_URL}${id}/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// =============================================================================
// Thunks — Admin
// =============================================================================

/** UC-RET-05: bandeja de devoluciones pendientes para el admin. */
export const fetchAdminReturns = createAsyncThunk(
  'returns/fetchAdmin',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-02/03/06: detalle admin con todas las acciones disponibles. */
export const fetchAdminReturnDetail = createAsyncThunk(
  'returns/fetchAdminDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`${ADMIN_URL}${id}/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-02: aprueba la solicitud (puede ser parcial via items_aprobados). */
export const approveReturnRequest = createAsyncThunk(
  'returns/approve',
  async ({ id, justification, approvedItems = [] }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_URL}${id}/approve/`, {
        justification,
        approved_items: approvedItems,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-02: rechaza la solicitud con justificacion. */
export const rejectReturnRequest = createAsyncThunk(
  'returns/reject',
  async ({ id, justification }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_URL}${id}/reject/`, {
        justification,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-02 Alt B: solicita informacion adicional al comprador. */
export const requestInfoReturnRequest = createAsyncThunk(
  'returns/requestInfo',
  async ({ id, message }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_URL}${id}/request-info/`, {
        message,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-03: registra la recepcion fisica del producto devuelto. */
export const registerReturnReception = createAsyncThunk(
  'returns/registerReception',
  async ({ id, productCondition, observations = '' }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_URL}${id}/reception/`, {
        product_condition: productCondition,
        observations,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-RET-06: procesa el reembolso de la devolucion. */
export const processReturnRefund = createAsyncThunk(
  'returns/processRefund',
  async ({ id, amount }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_URL}${id}/refund/`, {
        amount,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// =============================================================================
// Slice
// =============================================================================

const initialState = {
  items:         [],
  current:       null,
  metrics:       null,
  isLoading:     false,
  isActioning:   false,
  error:         null,
  actionError:   null,
  lastAction:    null, // 'created' | 'approved' | 'rejected' | 'info_requested' | 'received' | 'refunded'
  lastCreatedId: null,
};

function applyUpdate(state, updated) {
  if (!updated) return;
  if (state.current && state.current.id === updated.id) {
    state.current = { ...state.current, ...updated };
  }
  state.items = state.items.map((r) =>
    r.id === updated.id ? { ...r, ...updated } : r
  );
}

const returnsSlice = createSlice({
  name: 'returns',
  initialState,

  reducers: {
    clearReturnsActionState(state) {
      state.actionError   = null;
      state.lastAction    = null;
      state.lastCreatedId = null;
    },
    clearCurrentReturn(state) {
      state.current = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // createReturnRequest (UC-RET-01)
      .addCase(createReturnRequest.pending, (state) => {
        state.isActioning   = true;
        state.actionError   = null;
        state.lastCreatedId = null;
      })
      .addCase(createReturnRequest.fulfilled, (state, action) => {
        state.isActioning   = false;
        state.lastAction    = 'created';
        state.lastCreatedId = action.payload?.id ?? null;
        state.items         = [action.payload, ...state.items];
      })
      .addCase(createReturnRequest.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // fetchCustomerReturns (UC-RET-04 listado)
      .addCase(fetchCustomerReturns.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchCustomerReturns.fulfilled, (state, action) => {
        const results = action.payload?.results ?? action.payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.isLoading = false;
      })
      .addCase(fetchCustomerReturns.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // fetchCustomerReturnDetail (UC-RET-04 detalle)
      .addCase(fetchCustomerReturnDetail.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
        state.current   = null;
      })
      .addCase(fetchCustomerReturnDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.current   = action.payload;
      })
      .addCase(fetchCustomerReturnDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // fetchAdminReturns (UC-RET-05)
      .addCase(fetchAdminReturns.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchAdminReturns.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        const results = payload.results ?? payload.returns ?? payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.metrics   = payload.metrics ?? null;
        state.isLoading = false;
      })
      .addCase(fetchAdminReturns.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // fetchAdminReturnDetail (UC-RET-02/03/06 detalle)
      .addCase(fetchAdminReturnDetail.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
        state.current   = null;
      })
      .addCase(fetchAdminReturnDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.current   = action.payload;
      })
      .addCase(fetchAdminReturnDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // approveReturnRequest (UC-RET-02)
      .addCase(approveReturnRequest.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(approveReturnRequest.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'approved';
        applyUpdate(state, action.payload);
      })
      .addCase(approveReturnRequest.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // rejectReturnRequest (UC-RET-02)
      .addCase(rejectReturnRequest.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(rejectReturnRequest.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'rejected';
        applyUpdate(state, action.payload);
      })
      .addCase(rejectReturnRequest.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // requestInfoReturnRequest (UC-RET-02 Alt B)
      .addCase(requestInfoReturnRequest.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(requestInfoReturnRequest.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'info_requested';
        applyUpdate(state, action.payload);
      })
      .addCase(requestInfoReturnRequest.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // registerReturnReception (UC-RET-03)
      .addCase(registerReturnReception.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(registerReturnReception.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'received';
        applyUpdate(state, action.payload);
      })
      .addCase(registerReturnReception.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // processReturnRefund (UC-RET-06)
      .addCase(processReturnRefund.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(processReturnRefund.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'refunded';
        applyUpdate(state, action.payload);
      })
      .addCase(processReturnRefund.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  clearReturnsActionState,
  clearCurrentReturn,
} = returnsSlice.actions;

export default returnsSlice.reducer;
