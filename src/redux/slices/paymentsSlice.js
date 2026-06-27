/**
 * paymentsSlice — PracticaYoruba
 *
 * Pagos: thunks para mutaciones del dominio payments.
 *
 *   UC-PAY-01 — Iniciar pago Mercado Pago
 *   UC-PAY-02 — Iniciar pago PayPal
 *   UC-PAY-08 — Reintentar pago fallido
 *   UC-PAY-09 — Procesar reembolso manual (admin)
 *
 * Lecturas (estado de pago, historial, listado admin) viven en
 *   src/hooks/domain/usePayments.js via React Query.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// V1 endpoint: Checkout Pro (redirect). Accepts { order_number, gateway }.
// Used for PayPal and legacy MP Checkout Pro.
const V1_INITIATE_URL  = '/api/v1/payments/initiate/';
// V2 endpoint: Checkout API (on-site). Requires { order_number, token, ... }.
// Used for MercadoPago CardForm (ADR-018).
const V2_CHECKOUT_API_URL = '/api/v2/payments/initiate/';
const ADMIN_REFUND_URL    = '/api/v2/payments/admin';
const ADMIN_CANCEL_URL    = (paymentId) => `/api/v1/admin/payments/${paymentId}/cancel/`;

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
      const res = await apiService.post(V2_CHECKOUT_API_URL, payload);
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
      const res = await apiService.post(V2_CHECKOUT_API_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-02: inicia el pago con PayPal (Checkout Pro — redirect).
 *
 * Usa V1 endpoint: PayPal no tiene CardForm, se paga por redirect.
 * Acepta `{ order_number }`. Respuesta: `{ checkout_url, ... }`.
 */
export const initiatePayPalPayment = createAsyncThunk(
  'payments/initiatePayPal',
  async ({ order_number }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(
        V1_INITIATE_URL,
        { order_number, gateway: 'PAYPAL' }
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-08: reintenta el pago de una orden, permitiendo cambiar el
 * gateway. Retry = re-initiate via v1 (Checkout Pro) para PayPal;
 * para MP usar initiateCheckoutApiPayment con nuevo token.
 */
export const retryPayment = createAsyncThunk(
  'payments/retry',
  async ({ order_number, gateway }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(V1_INITIATE_URL, { order_number, gateway });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-01 (legacy Checkout Pro): inicia pago MP con redirect.
 * Kept for backward compatibility with pages that use Checkout Pro flow.
 */
export const initiateMercadoPagoPayment = createAsyncThunk(
  'payments/initiateMercadoPago',
  async ({ order_number, installments }, { rejectWithValue }) => {
    try {
      const payload = { order_number, gateway: 'MERCADOPAGO' };
      if (installments) payload.installments = Number(installments);
      const res = await apiService.post(V1_INITIATE_URL, payload);
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
  lastAction:       null, // 'mp_checkout_api' | 'paypal_initiated' | 'retried' | 'refunded' | 'cancelled'
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

      // initiateMercadoPagoPayment (legacy Checkout Pro)
      .addCase(initiateMercadoPagoPayment.pending, (state) => {
        state.isActioning    = true;
        state.actionError    = null;
        state.lastInitiation = null;
      })
      .addCase(initiateMercadoPagoPayment.fulfilled, (state, action) => {
        state.isActioning    = false;
        state.lastAction     = 'mp_initiated';
        state.lastInitiation = { gateway: 'mercadopago', ...action.payload };
      })
      .addCase(initiateMercadoPagoPayment.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // initiatePayPalPayment (UC-PAY-02)
      .addCase(initiatePayPalPayment.pending, (state) => {
        state.isActioning    = true;
        state.actionError    = null;
        state.lastInitiation = null;
      })
      .addCase(initiatePayPalPayment.fulfilled, (state, action) => {
        state.isActioning    = false;
        state.lastAction     = 'paypal_initiated';
        state.lastInitiation = { gateway: 'paypal', ...action.payload };
      })
      .addCase(initiatePayPalPayment.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // retryPayment (UC-PAY-08)
      .addCase(retryPayment.pending, (state) => {
        state.isActioning    = true;
        state.actionError    = null;
        state.lastInitiation = null;
      })
      .addCase(retryPayment.fulfilled, (state, action) => {
        state.isActioning    = false;
        state.lastAction     = 'retried';
        state.lastInitiation = action.payload;
      })
      .addCase(retryPayment.rejected, (state, action) => {
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
