/**
 * notificationsSlice — PracticaYoruba
 * Notificaciones del comprador y administrador.
 *
 *   UC-NOT-06 — Gestionar preferencias de notificacion
 *   UC-NOT-07 — Enviar notificacion manual a usuario (admin)
 *
 * Lecturas (listas, badges) viven en src/hooks/domain/useNotifications.js
 * vía React Query. Aqui residen las mutaciones + estado `lastAction`.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const PREFERENCES_URL          = '/api/v1/notifications/preferences/';
const MARK_AS_READ_URL         = (id) => `/api/v1/notifications/${id}/read/`;
const MARK_ALL_AS_READ_URL     = '/api/v1/notifications/read-all/';
const ADMIN_MANUAL_NOTIFY_URL  = '/api/v1/admin/notifications/manual/';
const ADMIN_AUDIENCE_COUNT_URL = '/api/v1/admin/notifications/audience-count/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-NOT-06: leer preferencias (lectura puntual usada antes de editar). */
export const fetchNotificationPreferences = createAsyncThunk(
  'notifications/fetchPreferences',
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await apiService.get(PREFERENCES_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-NOT-06: actualizar todas las preferencias del usuario. */
export const updateNotificationPreferences = createAsyncThunk(
  'notifications/updatePreferences',
  async (preferences, { rejectWithValue }) => {
    try {
      const res = await apiService.put(PREFERENCES_URL, { preferences });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** Marcar una notificacion como leida. */
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(MARK_AS_READ_URL(id));
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** Marcar todas las notificaciones como leidas. */
export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await apiService.post(MARK_ALL_AS_READ_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-NOT-07: envio manual a destinatario(s) por parte del admin. */
export const sendManualNotification = createAsyncThunk(
  'notifications/sendManual',
  async (
    { recipientType, recipientIdentifier, productId, subject, message },
    { rejectWithValue },
  ) => {
    try {
      const res = await apiService.post(ADMIN_MANUAL_NOTIFY_URL, {
        recipient_type:       recipientType,
        recipient_identifier: recipientIdentifier,
        product_id:           productId,
        subject,
        message,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-NOT-07 Alt C: pre-conteo del segmento antes de confirmar el envio. */
export const fetchManualNotificationAudience = createAsyncThunk(
  'notifications/fetchAudience',
  async ({ recipientType, productId }, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_AUDIENCE_COUNT_URL, {
        params: {
          recipient_type: recipientType,
          product_id:     productId,
        },
      });
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
  preferences:    [],
  audienceCount:  null,
  isLoading:      false,
  isActioning:    false,
  error:          null,
  actionError:    null,
  lastAction:     null,  // 'preferences_saved' | 'marked_read' | 'marked_all_read' | 'manual_sent'
  lastSentReport: null,  // payload del envio manual
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,

  reducers: {
    clearNotificationsActionState(state) {
      state.actionError    = null;
      state.lastAction     = null;
      state.lastSentReport = null;
    },
    setPreferences(state, action) {
      state.preferences = Array.isArray(action.payload) ? action.payload : [];
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchNotificationPreferences (UC-NOT-06)
      .addCase(fetchNotificationPreferences.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchNotificationPreferences.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        const results = payload.results ?? payload.preferences ?? payload ?? [];
        state.preferences = Array.isArray(results) ? results : [];
        state.isLoading   = false;
      })
      .addCase(fetchNotificationPreferences.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // updateNotificationPreferences (UC-NOT-06)
      .addCase(updateNotificationPreferences.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(updateNotificationPreferences.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'preferences_saved';
        const payload = action.payload ?? {};
        const results = payload.results ?? payload.preferences ?? payload ?? [];
        state.preferences = Array.isArray(results) ? results : state.preferences;
      })
      .addCase(updateNotificationPreferences.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // markNotificationAsRead
      .addCase(markNotificationAsRead.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'marked_read';
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'marked_all_read';
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // fetchManualNotificationAudience (UC-NOT-07 Alt C)
      .addCase(fetchManualNotificationAudience.pending, (state) => {
        state.isActioning  = true;
        state.actionError  = null;
        state.audienceCount = null;
      })
      .addCase(fetchManualNotificationAudience.fulfilled, (state, action) => {
        state.isActioning   = false;
        state.audienceCount = action.payload?.count ?? action.payload?.total ?? 0;
      })
      .addCase(fetchManualNotificationAudience.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // sendManualNotification (UC-NOT-07)
      .addCase(sendManualNotification.pending, (state) => {
        state.isActioning    = true;
        state.actionError    = null;
        state.lastSentReport = null;
      })
      .addCase(sendManualNotification.fulfilled, (state, action) => {
        state.isActioning    = false;
        state.lastAction     = 'manual_sent';
        state.lastSentReport = action.payload ?? null;
      })
      .addCase(sendManualNotification.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  clearNotificationsActionState,
  setPreferences,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
