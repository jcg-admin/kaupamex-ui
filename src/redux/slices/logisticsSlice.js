/**
 * logisticsSlice — UC-LOG-08 (acciones operacionales desde el panel)
 *
 *   confirmDelivery   POST /api/v2/logistics/guides/:guideId/confirm-delivery/
 *
 * La lectura del panel (grupos A y B) la expone `useLogistics`.
 * Las acciones de UC-LOG-01 (crear guia) y UC-LOG-02 (registrar
 * rastreo) navegan a sus rutas propias y se cubren en otros slices.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

export const confirmDelivery = createAsyncThunk(
  'logistics/confirmDelivery',
  async (guideId, { rejectWithValue }) => {
    try {
      const res = await apiService.post(
        `/api/v2/logistics/guides/${guideId}/confirm-delivery/`,
        {},
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-LOG-01: lista de couriers activos para el selector de creación de guía. */
export const fetchCouriers = createAsyncThunk(
  'logistics/fetchCouriers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get('/api/v2/logistics/couriers/');
      const data = res.data;
      return Array.isArray(data) ? data : (data?.results ?? []);
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** Guía existente de una orden (admin, por order_number). null si no hay. */
export const fetchOrderGuide = createAsyncThunk(
  'logistics/fetchOrderGuide',
  async (orderNumber, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`/api/v2/logistics/admin/orders/${orderNumber}/guide/`);
      return res.data;
    } catch (err) {
      if (err?.response?.status === 404) return null; // sin guía aún
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-LOG-02: actualizar estado y/o rastreo de una guía existente. */
export const updateGuide = createAsyncThunk(
  'logistics/updateGuide',
  async ({ guideId, status, trackingNumber }, { rejectWithValue }) => {
    try {
      const body = {};
      if (status) body.status = status;
      if (trackingNumber) body.tracking_number = trackingNumber;
      const res = await apiService.patch(`/api/v2/logistics/guides/${guideId}/`, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-LOG-01: crear guía de envío para una orden IN_PREPARATION. */
export const createShipmentGuide = createAsyncThunk(
  'logistics/createShipmentGuide',
  async ({ orderNumber, courierId, trackingNumber, notes }, { rejectWithValue }) => {
    try {
      const res = await apiService.post('/api/v2/logistics/guides/', {
        order_number: orderNumber,
        courier_id: courierId,
        tracking_number: trackingNumber,
        ...(notes ? { notes } : {}),
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const initialState = {
  isActioning: false, actionError: null, lastAction: null, couriers: [],
};

const logisticsSlice = createSlice({
  name: 'logistics',
  initialState,
  reducers: {
    clearLogisticsActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(confirmDelivery.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(confirmDelivery.fulfilled, (state) => {
        state.isActioning = false; state.lastAction = 'delivery_confirmed';
      })
      .addCase(confirmDelivery.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      })
      .addCase(fetchCouriers.fulfilled, (state, action) => {
        state.couriers = action.payload;
      })
      .addCase(createShipmentGuide.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(createShipmentGuide.fulfilled, (state) => {
        state.isActioning = false; state.lastAction = 'guide_created';
      })
      .addCase(createShipmentGuide.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      });
  },
});

export const { clearLogisticsActionState } = logisticsSlice.actions;
export default logisticsSlice.reducer;
