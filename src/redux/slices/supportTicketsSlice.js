/**
 * supportTicketsSlice — PracticaYoruba
 * Soporte: gestion de tickets del comprador y bandeja admin.
 *
 *   UC-SUPP-01 — Crear ticket
 *   UC-SUPP-02 — Listar tickets / ver detalle
 *   UC-SUPP-03 — Responder ticket (chat)
 *   UC-SUPP-04 — Cerrar / Reabrir ticket
 *   UC-SUPP-05 — Bandeja del admin
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const TICKETS_URL       = '/api/v1/support/tickets/';
const ADMIN_TICKETS_URL = '/api/v1/admin/support/tickets/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-SUPP-02: Listar tickets del comprador */
export const fetchSupportTickets = createAsyncThunk(
  'supportTickets/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(TICKETS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-SUPP-02: Obtener detalle de un ticket */
export const fetchSupportTicketDetail = createAsyncThunk(
  'supportTickets/fetchDetail',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`${TICKETS_URL}${id}/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-SUPP-01: Crear ticket */
export const createSupportTicket = createAsyncThunk(
  'supportTickets/create',
  async (ticketData, { rejectWithValue }) => {
    try {
      const res = await apiService.post(TICKETS_URL, ticketData);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-SUPP-03: Responder ticket */
export const replySupportTicket = createAsyncThunk(
  'supportTickets/reply',
  async ({ id, body, isInternal = false }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${TICKETS_URL}${id}/replies/`, {
        body,
        is_internal: isInternal,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-SUPP-04: Cerrar ticket */
export const closeSupportTicket = createAsyncThunk(
  'supportTickets/close',
  async ({ id, reason = '' }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${TICKETS_URL}${id}/close/`, { reason });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-SUPP-04 Alt A: Reabrir ticket */
export const reopenSupportTicket = createAsyncThunk(
  'supportTickets/reopen',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${TICKETS_URL}${id}/reopen/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-SUPP-05: Bandeja del admin */
export const fetchAdminSupportTickets = createAsyncThunk(
  'supportTickets/fetchAdmin',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_TICKETS_URL, { params });
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
  items:        [],
  current:      null,
  metrics:      null,
  isLoading:    false,
  isActioning:  false,
  error:        null,
  actionError:  null,
  lastAction:   null, // 'created' | 'replied' | 'closed' | 'reopened'
  lastCreatedId: null,
};

function applyTicketUpdate(state, updated) {
  if (!updated) return;
  if (state.current && state.current.id === updated.id) {
    state.current = { ...state.current, ...updated };
  }
  state.items = state.items.map((t) =>
    t.id === updated.id ? { ...t, ...updated } : t
  );
}

const supportTicketsSlice = createSlice({
  name: 'supportTickets',
  initialState,

  reducers: {
    clearSupportTicketActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
      state.lastCreatedId = null;
    },
    clearCurrentSupportTicket(state) {
      state.current = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchSupportTickets
      .addCase(fetchSupportTickets.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchSupportTickets.fulfilled, (state, action) => {
        const results = action.payload?.results ?? action.payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.isLoading = false;
      })
      .addCase(fetchSupportTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // fetchSupportTicketDetail
      .addCase(fetchSupportTicketDetail.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
        state.current   = null;
      })
      .addCase(fetchSupportTicketDetail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.current   = action.payload;
      })
      .addCase(fetchSupportTicketDetail.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // createSupportTicket (UC-SUPP-01)
      .addCase(createSupportTicket.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
        state.lastCreatedId = null;
      })
      .addCase(createSupportTicket.fulfilled, (state, action) => {
        state.isActioning   = false;
        state.lastAction    = 'created';
        state.lastCreatedId = action.payload?.id ?? null;
        state.items         = [action.payload, ...state.items];
      })
      .addCase(createSupportTicket.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // replySupportTicket (UC-SUPP-03)
      .addCase(replySupportTicket.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(replySupportTicket.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'replied';
        if (state.current) {
          const replies = state.current.replies ?? [];
          state.current  = {
            ...state.current,
            replies: [...replies, action.payload],
          };
        }
      })
      .addCase(replySupportTicket.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // closeSupportTicket (UC-SUPP-04)
      .addCase(closeSupportTicket.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(closeSupportTicket.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'closed';
        applyTicketUpdate(state, action.payload);
      })
      .addCase(closeSupportTicket.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // reopenSupportTicket (UC-SUPP-04 Alt A)
      .addCase(reopenSupportTicket.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(reopenSupportTicket.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'reopened';
        applyTicketUpdate(state, action.payload);
      })
      .addCase(reopenSupportTicket.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // fetchAdminSupportTickets (UC-SUPP-05)
      .addCase(fetchAdminSupportTickets.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchAdminSupportTickets.fulfilled, (state, action) => {
        const payload   = action.payload ?? {};
        const results   = payload.results ?? payload.tickets ?? payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.metrics   = payload.metrics ?? null;
        state.isLoading = false;
      })
      .addCase(fetchAdminSupportTickets.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });
  },
});

export const {
  clearSupportTicketActionState,
  clearCurrentSupportTicket,
} = supportTicketsSlice.actions;

export default supportTicketsSlice.reducer;
