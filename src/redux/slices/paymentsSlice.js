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

// DEC-BC-09 (2026-05-21): backend tiene UN SOLO endpoint
// /api/v1/payments/initiate/ que acepta `gateway: MERCADOPAGO|PAYPAL`.
// Las constantes anteriores /mercadopago/checkout + /paypal/checkout
// eran 404 en produccion (audit T-101 U-04 + U-05). Single endpoint
// alineado a InitiatePaymentSerializer (apps/payments/serializers.py:25-29).
const PAYMENTS_INITIATE_URL = '/api/v1/payments/initiate/';
const ADMIN_REFUND_URL      = '/api/v1/payments/admin';

// =============================================================================
// Thunks
// =============================================================================

/**
 * UC-PAY-01: inicia el pago con Mercado Pago.
 *
 * DEC-BC-09: contract alineado al backend canonico.
 * Acepta `{ order_number, installments }` (installments opcional —
 * UC-PAY-01-EXT MSI). Envia body `{ order_number, gateway: 'MERCADOPAGO',
 * installments? }`. Respuesta backend: `{ payment_id, checkout_url,
 * order_number, amount, installments }`.
 */
export const initiateMercadoPagoPayment = createAsyncThunk(
  'payments/initiateMercadoPago',
  async ({ order_number, installments }, { rejectWithValue }) => {
    try {
      const payload = { order_number, gateway: 'MERCADOPAGO' };
      if (installments) payload.installments = Number(installments);
      const res = await apiService.post(PAYMENTS_INITIATE_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-PAY-02: inicia el pago con PayPal.
 *
 * DEC-BC-09: mismo endpoint que MP, diferencia por `gateway`.
 * Acepta `{ order_number }`. Envia `{ order_number, gateway: 'PAYPAL' }`.
 * Respuesta backend: igual shape que MP (checkout_url, etc.).
 */
export const initiatePayPalPayment = createAsyncThunk(
  'payments/initiatePayPal',
  async ({ order_number }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(
        PAYMENTS_INITIATE_URL,
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
 * gateway. Retry = re-initiate: no hay endpoint separado.
 *
 * DEC-BC-09: contract alineado a backend. Envia `{ order_number,
 * gateway }`. Respuesta canonica `{ checkout_url, ... }`.
 */
export const retryPayment = createAsyncThunk(
  'payments/retry',
  async ({ order_number, gateway }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(PAYMENTS_INITIATE_URL, { order_number, gateway });
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
  lastInitiation: null, // { gateway, checkout_url, payment_id, order_number, amount, installments } (DEC-BC-09)
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
