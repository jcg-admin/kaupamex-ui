/**
 * Checkout Slice — PracticaYoruba
 * Gestiona el flujo de compra: dirección → envío → pago → confirmación
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const CREATE_ORDER_URL = '/api/v1/orders/checkout/';
const PAYMENTS_URL     = '/api/v1/payments/initiate/';

export const createOrder = createAsyncThunk(
  'checkout/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      // DEC-BC-03: Idempotency-Key previene doble orden en reintentos.
      const idempotencyKey = crypto.randomUUID();
      const res = await apiService.post(CREATE_ORDER_URL, orderData, {
        headers: { 'Idempotency-Key': idempotencyKey },
      });
      return res.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

/**
 * UC-PAY-01: inicia pago con Mercado Pago.
 * DEC-BC-09: POST /api/v1/payments/initiate/ con gateway: MERCADOPAGO.
 * Acepta { order_number, installments? }.
 */
export const initMercadoPago = createAsyncThunk(
  'checkout/initMercadoPago',
  async ({ order_number, installments }, { rejectWithValue }) => {
    try {
      const payload = { order_number, gateway: 'MERCADOPAGO' };
      if (installments) payload.installments = Number(installments);
      const res = await apiService.post(PAYMENTS_URL, payload);
      return res.data; // { payment_id, checkout_url, order_number, amount, installments }
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

/**
 * UC-PAY-02: inicia pago con PayPal.
 * DEC-BC-09: mismo endpoint, gateway: PAYPAL.
 */
export const initPayPal = createAsyncThunk(
  'checkout/initPayPal',
  async ({ order_number }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(PAYMENTS_URL, { order_number, gateway: 'PAYPAL' });
      return res.data; // { payment_id, checkout_url, order_number, amount, installments }
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

// Pasos del checkout
export const CHECKOUT_STEPS = {
  ADDRESS:  'address',
  SHIPPING: 'shipping',
  PAYMENT:  'payment',
  CONFIRM:  'confirm',
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState: {
    step:            CHECKOUT_STEPS.ADDRESS,
    // H-CICLO78-05: field names aligned to OrderAddressInputSerializer contract.
    // Previous names (first_name/last_name/postal_code) did not match the API
    // fields (recipient_name/zip_code) and would cause silent validation errors
    // if any consumer dispatched setAddress() and built a checkout payload from
    // this slice state.
    address: {
      recipient_name: '', email: '', phone: '',
      street: '', city: '', state: '',
      zip_code: '', country: 'MX',
    },
    shippingMethod:  null,
    shippingOptions: [],
    paymentMethod:   null, // 'mercadopago' | 'paypal'
    orderId:         null,
    paymentData:     null, // { payment_id, checkout_url, ... } per DEC-BC-09
    isLoading:       false,
    error:           null,
  },
  reducers: {
    setStep(state, action)     { state.step = action.payload; },
    nextStep(state) {
      const steps = Object.values(CHECKOUT_STEPS);
      const idx   = steps.indexOf(state.step);
      if (idx < steps.length - 1) state.step = steps[idx + 1];
    },
    prevStep(state) {
      const steps = Object.values(CHECKOUT_STEPS);
      const idx   = steps.indexOf(state.step);
      if (idx > 0) state.step = steps[idx - 1];
    },
    setAddress(state, action)       { state.address = { ...state.address, ...action.payload }; },
    setShippingMethod(state, action){ state.shippingMethod = action.payload; },
    setPaymentMethod(state, action) { state.paymentMethod = action.payload; },
    setShippingOptions(state, action){ state.shippingOptions = action.payload; },
    resetCheckout(state) {
      state.step           = CHECKOUT_STEPS.ADDRESS;
      state.shippingMethod = null;
      state.paymentMethod  = null;
      state.orderId        = null;
      state.paymentData    = null;
      state.error          = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending,  (state) => { state.isLoading = true; state.error = null; })
      .addCase(createOrder.fulfilled,(state, action) => {
        state.isLoading = false;
        state.orderId   = action.payload.id;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    builder
      .addCase(initMercadoPago.pending,  (state) => { state.isLoading = true; state.error = null; })
      .addCase(initMercadoPago.fulfilled,(state, action) => {
        state.isLoading  = false;
        state.paymentData = action.payload;
        state.step        = CHECKOUT_STEPS.CONFIRM;
      })
      .addCase(initMercadoPago.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    builder
      .addCase(initPayPal.pending,  (state) => { state.isLoading = true; state.error = null; })
      .addCase(initPayPal.fulfilled,(state, action) => {
        state.isLoading  = false;
        state.paymentData = action.payload;
        state.step        = CHECKOUT_STEPS.CONFIRM;
      })
      .addCase(initPayPal.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });
  },
});

export const {
  setStep, nextStep, prevStep,
  setAddress, setShippingMethod, setPaymentMethod,
  setShippingOptions, resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;
