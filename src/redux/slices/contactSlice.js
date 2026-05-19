/**
 * contactSlice — PracticaYoruba
 *
 *   UC-COM-01 — Enviar formulario de contacto (visitante)
 *   UC-COM-02 — Ver mensajes de contacto (admin) — solo se modela la
 *               mutacion de marcar-leido aqui; las lecturas viven en
 *               `useContactMessages` (React Query).
 *   UC-COM-03 — Responder mensaje de contacto (admin)
 *
 * Mantiene `lastAction` para que la UI distinga estados puntuales
 * (enviado, respondido, marcado-leido).
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const CONTACT_PUBLIC_URL       = '/api/v1/contact/messages/';
const ADMIN_CONTACT_LIST_URL   = '/api/v1/admin/contact/messages/';
const ADMIN_CONTACT_DETAIL_URL = (id) => `/api/v1/admin/contact/messages/${id}/`;
const ADMIN_CONTACT_REPLY_URL  = (id) => `/api/v1/admin/contact/messages/${id}/reply/`;
const ADMIN_CONTACT_READ_URL   = (id) => `/api/v1/admin/contact/messages/${id}/read/`;

// =============================================================================
// Thunks
// =============================================================================

/** UC-COM-01: visitante envia el formulario publico de contacto. */
export const sendContactMessage = createAsyncThunk(
  'contact/send',
  async ({ name, email, subject, message }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(CONTACT_PUBLIC_URL, {
        name,
        email,
        subject,
        message,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-COM-02: admin marca el mensaje como leido. */
export const markContactMessageRead = createAsyncThunk(
  'contact/markRead',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_CONTACT_READ_URL(id));
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-COM-03: admin responde al mensaje del visitante. */
export const replyContactMessage = createAsyncThunk(
  'contact/reply',
  async ({ id, replyBody, internalNote }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_CONTACT_REPLY_URL(id), {
        reply_body:    replyBody,
        internal_note: internalNote || null,
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
  lastAction:   null, // 'sent' | 'replied' | 'marked_read'
  lastSentId:   null,
  lastRepliedId: null,
};

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    clearContactActionState(state) {
      state.actionError   = null;
      state.lastAction    = null;
      state.lastSentId    = null;
      state.lastRepliedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // UC-COM-01
      .addCase(sendContactMessage.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(sendContactMessage.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'sent';
        state.lastSentId  = action.payload?.id ?? null;
      })
      .addCase(sendContactMessage.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // UC-COM-02
      .addCase(markContactMessageRead.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(markContactMessageRead.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'marked_read';
      })
      .addCase(markContactMessageRead.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // UC-COM-03
      .addCase(replyContactMessage.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(replyContactMessage.fulfilled, (state, action) => {
        state.isActioning  = false;
        state.lastAction   = 'replied';
        state.lastRepliedId = action.meta?.arg?.id ?? action.payload?.id ?? null;
      })
      .addCase(replyContactMessage.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export { ADMIN_CONTACT_LIST_URL, ADMIN_CONTACT_DETAIL_URL };
export const { clearContactActionState } = contactSlice.actions;
export default contactSlice.reducer;
