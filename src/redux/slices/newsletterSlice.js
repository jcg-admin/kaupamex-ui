/**
 * newsletterSlice — PracticaYoruba
 *
 *   UC-NEW-01 — Suscribirse al newsletter (visitante)
 *   UC-NEW-02 — Desuscribirse (sin auth, via token)
 *   UC-NEW-03 — Gestionar suscriptores (admin) — desuscripcion manual
 *   UC-NEW-04 — Enviar campana de newsletter (admin)
 *
 * Lecturas (lista de suscriptores) viven en
 * src/hooks/domain/useNewsletter.js via React Query.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const SUBSCRIBE_URL                 = '/api/v1/newsletter/subscribe/';
const UNSUBSCRIBE_URL               = '/api/v1/newsletter/unsubscribe/';
const ADMIN_UNSUBSCRIBE_MANUAL_URL  = (id) => `/api/v1/admin/newsletter/subscribers/${id}/unsubscribe/`;
const ADMIN_BROADCAST_URL           = '/api/v1/admin/newsletter/campaigns/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-NEW-01: visitante se suscribe (doble optin). */
export const subscribeNewsletter = createAsyncThunk(
  'newsletter/subscribe',
  async ({ email, source }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(SUBSCRIBE_URL, {
        email,
        source: source ?? 'page',
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-NEW-02: desuscripcion via token firmado (sin auth). */
export const unsubscribeNewsletter = createAsyncThunk(
  'newsletter/unsubscribe',
  async ({ token, reason }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(UNSUBSCRIBE_URL, {
        token,
        reason: reason || null,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-NEW-03: el admin desuscribe a peticion del titular. */
export const adminUnsubscribeSubscriber = createAsyncThunk(
  'newsletter/adminUnsubscribe',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_UNSUBSCRIBE_MANUAL_URL(id), {
        reason: reason || 'SOLICITUD_MANUAL',
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-NEW-04: el admin envia (o programa) una campana de newsletter. */
export const sendNewsletterBroadcast = createAsyncThunk(
  'newsletter/sendBroadcast',
  async (
    { subject, htmlBody, textBody, segment, scheduledAt },
    { rejectWithValue },
  ) => {
    try {
      const res = await apiService.post(ADMIN_BROADCAST_URL, {
        subject,
        html_body:    htmlBody,
        text_body:    textBody,
        segment:      segment ?? 'ALL_ACTIVE',
        scheduled_at: scheduledAt || null,
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
  isActioning:  false,
  actionError:  null,
  lastAction:   null, // 'subscribed' | 'unsubscribed' | 'admin_unsubscribed' | 'broadcast_sent'
  lastCampaign: null,
};

const newsletterSlice = createSlice({
  name: 'newsletter',
  initialState,
  reducers: {
    clearNewsletterActionState(state) {
      state.actionError  = null;
      state.lastAction   = null;
      state.lastCampaign = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(subscribeNewsletter.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(subscribeNewsletter.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'subscribed';
      })
      .addCase(subscribeNewsletter.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(unsubscribeNewsletter.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(unsubscribeNewsletter.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'unsubscribed';
      })
      .addCase(unsubscribeNewsletter.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(adminUnsubscribeSubscriber.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(adminUnsubscribeSubscriber.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'admin_unsubscribed';
      })
      .addCase(adminUnsubscribeSubscriber.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(sendNewsletterBroadcast.pending, (state) => {
        state.isActioning  = true;
        state.actionError  = null;
        state.lastCampaign = null;
      })
      .addCase(sendNewsletterBroadcast.fulfilled, (state, action) => {
        state.isActioning  = false;
        state.lastAction   = 'broadcast_sent';
        state.lastCampaign = action.payload ?? null;
      })
      .addCase(sendNewsletterBroadcast.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearNewsletterActionState } = newsletterSlice.actions;
export default newsletterSlice.reducer;
