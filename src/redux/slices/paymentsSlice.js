/**
 * paymentsSlice — PracticaYoruba
 *
 * Pagos: thunks para mutaciones del dominio payments.
 *
 *   UC-PAY-01 — Iniciar pago Mercado Pago (Checkout API on-site, ADR-018)
 *   UC-PAY-13 — Iniciar pago sin tarjeta (OXXO, SPEI, Paycash)
 *   UC-PAY-08 — Reintentar pago fallido
 *   UC-PAY-09 — Procesar reembolso manual (admin)
 *
 * Lecturas (estado de pago, historial, listado admin) viven en
 *   src/hooks/domain/usePayments.js via React Query.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// Endpoint on-site de inicio de pago (ADR-018, Checkout API vía Orders). El
// endpoint v2 exige `payment_method_id` y NO acepta `gateway`; sirve dos
// flujos según el payload:
//   - Tarjeta on-site (CardForm, ADR-018): { order_number, token, payment_method_id, ... }
//   - Sin tarjeta (OXXO/SPEI, UC-PAY-13):  { order_number, payment_method_id }
// El reintento (UC-PAY-08) NO es un flujo aparte: es volver a ejecutar este
// mismo initiate on-site sobre la orden PENDING (ver PaymentSelectionPage).
const INITIATE_URL     = '/api/v2/payments/initiate/';
const ADMIN_REFUND_URL    = '/api/v2/payments/admin';
const ADMIN_CANCEL_URL    = (paymentId) => `/api/v2/admin/payments/${paymentId}/cancel/`;

// =============================================================================
// Thunks
// =============================================================================

/**
 * UC-PAY-01-V2: inicia pago MP con Checkout API (on-site, CardForm).
 *
 * ADR-018: el frontend tokeniza con MP.js y envía el token al backend.
 * El backend procesa sincrónicamente y devuelve el resultado final.
 * No hay redirect — la respuesta es el resultado del pago.
 *
 * Payload: { order_number, token, payment_method_id?, issuer_id?,
 *            installments?, payer_email?, payer_identification_type?,
 *            payer_identification_number? }
 * Respuesta: { payment_id, gateway_payment_id, status, status_detail,
 *              order_number, amount, installments }
 */
export const initiateCheckoutApiPayment = createAsyncThunk(
  'payments/initiateCheckoutApi',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.post(INITIATE_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-13: inicia pago con método sin tarjeta (OXXO, SPEI, Paycash, etc.).
 *
 * Usa el mismo endpoint v2 pero sin token. La respuesta incluye:
 *   external_resource_url — URL del voucher/barcode para pago presencial
 *   date_of_expiration    — fecha límite de pago
 *   transaction_data      — CLABE para SPEI u otros datos de transacción
 *
 * Payload: { order_number, payment_method_id, payer_email? }
 */
export const initiateNonCardPayment = createAsyncThunk(
  'payments/initiateNonCard',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.post(INITIATE_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * T-CAN: el admin cancela proactivamente un pago PENDING.
 * Acepta `{ payment_id }`.
 */
export const adminCancelPayment = createAsyncThunk(
  'payments/adminCancel',
  async ({ payment_id }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_CANCEL_URL(payment_id));
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-09: el admin procesa manualmente un reembolso sobre un Payment APPROVED.
 * Acepta `{ payment_id, amount, reason }`.
 */
export const requestAdminRefund = createAsyncThunk(
  'payments/adminRefund',
  async ({ payment_id, amount, reason }, { rejectWithValue }) => {
    try {
      const url = `${ADMIN_REFUND_URL}/${payment_id}/refund/`;
      const res = await apiService.post(url, { amount, reason });
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
  isActioning:      false,
  actionError:      null,
  lastAction:       null, // 'mp_checkout_api' | 'mp_non_card' | 'retried' | 'refunded' | 'cancelled'
  lastInitiation:   null, // response shape varies by gateway
  lastRefund:       null,
  lastCancellation: null,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,

  reducers: {
    clearPaymentsActionState(state) {
      state.actionError      = null;
      state.lastAction       = null;
      state.lastInitiation   = null;
      state.lastRefund       = null;
      state.lastCancellation = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // initiateCheckoutApiPayment (UC-PAY-01-V2, ADR-018 Checkout API)
      .addCase(initiateCheckoutApiPayment.pending, (state) => {
        state.isActioning    = true;
        state.actionError    = null;
        state.lastInitiation = null;
      })
      .addCase(initiateCheckoutApiPayment.fulfilled, (state, action) => {
        state.isActioning    = false;
        state.lastAction     = 'mp_checkout_api';
        state.lastInitiation = { gateway: 'mercadopago', ...action.payload };
      })
      .addCase(initiateCheckoutApiPayment.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // initiateNonCardPayment (UC-PAY-13 — OXXO, SPEI, Paycash, etc.)
      .addCase(initiateNonCardPayment.pending, (state) => {
        state.isActioning    = true;
        state.actionError    = null;
        state.lastInitiation = null;
      })
      .addCase(initiateNonCardPayment.fulfilled, (state, action) => {
        state.isActioning    = false;
        state.lastAction     = 'mp_non_card';
        state.lastInitiation = { gateway: 'mercadopago', ...action.payload };
      })
      .addCase(initiateNonCardPayment.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // adminCancelPayment (T-CAN)
      .addCase(adminCancelPayment.pending, (state) => {
        state.isActioning      = true;
        state.actionError      = null;
        state.lastCancellation = null;
      })
      .addCase(adminCancelPayment.fulfilled, (state, action) => {
        state.isActioning      = false;
        state.lastAction       = 'cancelled';
        state.lastCancellation = action.payload;
      })
      .addCase(adminCancelPayment.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // requestAdminRefund (UC-PAY-09)
      .addCase(requestAdminRefund.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
        state.lastRefund  = null;
      })
      .addCase(requestAdminRefund.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'refunded';
        state.lastRefund  = action.payload;
      })
      .addCase(requestAdminRefund.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearPaymentsActionState } = paymentsSlice.actions;
export default paymentsSlice.reducer;
