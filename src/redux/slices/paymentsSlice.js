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

const MP_CHECKOUT_URL     = '/api/v1/payments/mercadopago/checkout';
const PAYPAL_CHECKOUT_URL = '/api/v1/payments/paypal/checkout';
const RETRY_URL           = '/api/v1/payments/retry';
const ADMIN_REFUND_URL    = '/api/v1/admin/payments';

// =============================================================================
// Thunks
// =============================================================================

/**
 * UC-PAY-01: inicia el pago con Mercado Pago.
 * Acepta `{ order_id, installments }` (installments opcional — UC-PAY-01-EXT MSI).
 * Respuesta esperada: `{ preference_id, payment_url }`.
 */
export const initiateMercadoPagoPayment = createAsyncThunk(
  'payments/initiateMercadoPago',
  async ({ order_id, installments }, { rejectWithValue }) => {
    try {
      const payload = { order_id };
      if (installments) payload.installments = Number(installments);
      const res = await apiService.post(MP_CHECKOUT_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-02: inicia el pago con PayPal.
 * Acepta `{ order_id }`. Respuesta: `{ paypal_order_id, approve_url }`.
 */
export const initiatePayPalPayment = createAsyncThunk(
  'payments/initiatePayPal',
  async ({ order_id }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(PAYPAL_CHECKOUT_URL, { order_id });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-08: reintenta el pago de una orden en `PENDING_PAYMENT`,
 * permitiendo cambiar el gateway.
 * Acepta `{ order_id, gateway }`. Respuesta: `{ preference_id|paypal_order_id, payment_url|approve_url }`.
 */
export const retryPayment = createAsyncThunk(
  'payments/retry',
  async ({ order_id, gateway }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(RETRY_URL, { order_id, gateway });
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
  isActioning:    false,
  actionError:    null,
  lastAction:     null, // 'mp_initiated' | 'paypal_initiated' | 'retried' | 'refunded'
  lastInitiation: null, // { gateway, payment_url|approve_url, preference_id|paypal_order_id }
  lastRefund:     null,
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,

  reducers: {
    clearPaymentsActionState(state) {
      state.actionError    = null;
      state.lastAction     = null;
      state.lastInitiation = null;
      state.lastRefund     = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // initiateMercadoPagoPayment (UC-PAY-01)
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
