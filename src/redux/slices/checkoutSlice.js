/**
 * Checkout Slice — PracticaYoruba
 * Gestiona el flujo de compra: dirección → envío → pago → confirmación
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

export const createOrder = createAsyncThunk(
  'checkout/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const res = await apiService.post('/api/orders/', orderData);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const initMercadoPago = createAsyncThunk(
  'checkout/initMercadoPago',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`/api/payments/mercadopago/create/`, { order_id: orderId });
      return res.data; // { preference_id, init_point }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const initPayPal = createAsyncThunk(
  'checkout/initPayPal',
  async (orderId, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`/api/payments/paypal/create/`, { order_id: orderId });
      return res.data; // { order_id, approve_url }
    } catch (error) {
      return rejectWithValue(error.message);
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
    address: {
      first_name: '', last_name: '', email: '', phone: '',
      street: '', number: '', city: '', state: '',
      postal_code: '', country: 'MX',
    },
    shippingMethod:  null,
    shippingOptions: [],
    paymentMethod:   null, // 'mercadopago' | 'paypal'
    orderId:         null,
    paymentData:     null, // preference_id (MP) | order_id (PayPal)
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
      .addCase(initMercadoPago.pending,  (state) => { state.isLoading = true; })
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
      .addCase(initPayPal.pending,  (state) => { state.isLoading = true; })
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
