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

/** Crear un courier (paquetería). name y code son obligatorios y únicos. */
export const createCourier = createAsyncThunk(
  'logistics/createCourier',
  async ({ name, code, trackingUrlTemplate }, { rejectWithValue }) => {
    try {
      const res = await apiService.post('/api/v2/logistics/couriers/', {
        name, code,
        ...(trackingUrlTemplate ? { tracking_url_template: trackingUrlTemplate } : {}),
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** Actualizar un courier (p. ej. reactivarlo con is_active). */
export const updateCourier = createAsyncThunk(
  'logistics/updateCourier',
  async ({ courierId, ...fields }, { rejectWithValue }) => {
    try {
      const body = {};
      if (fields.name !== undefined) body.name = fields.name;
      if (fields.code !== undefined) body.code = fields.code;
      if (fields.trackingUrlTemplate !== undefined) body.tracking_url_template = fields.trackingUrlTemplate;
      if (fields.isActive !== undefined) body.is_active = fields.isActive;
      const res = await apiService.patch(`/api/v2/logistics/couriers/${courierId}/`, body);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** Desactivar un courier (soft: is_active=false vía DELETE). */
export const deactivateCourier = createAsyncThunk(
  'logistics/deactivateCourier',
  async (courierId, { rejectWithValue }) => {
    try {
      await apiService.delete(`/api/v2/logistics/couriers/${courierId}/`);
      return { courierId };
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

/**
 * Cancelar una guía de envío (soft-delete en el backend). Usa el endpoint
 * dedicado `/cancel/` — distinto de PATCH status, porque además marca la guía
 * como eliminada. No admite guías ya entregadas o canceladas (400).
 */
export const cancelGuide = createAsyncThunk(
  'logistics/cancelGuide',
  async (guideId, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`/api/v2/logistics/guides/${guideId}/cancel/`, {});
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
      .addCase(createCourier.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(createCourier.fulfilled, (state, action) => {
        state.isActioning = false; state.lastAction = 'courier_created';
        state.couriers = [...state.couriers, action.payload]
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      })
      .addCase(createCourier.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      })
      .addCase(updateCourier.fulfilled, (state, action) => {
        state.isActioning = false; state.lastAction = 'courier_updated';
        state.couriers = state.couriers.map(
          (c) => (c.id === action.payload.id ? action.payload : c),
        );
      })
      .addCase(updateCourier.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      })
      .addCase(deactivateCourier.fulfilled, (state, action) => {
        state.isActioning = false; state.lastAction = 'courier_deactivated';
        state.couriers = state.couriers.map(
          (c) => (c.id === action.payload.courierId ? { ...c, is_active: false } : c),
        );
      })
      .addCase(deactivateCourier.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      })
      .addCase(createShipmentGuide.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(createShipmentGuide.fulfilled, (state) => {
        state.isActioning = false; state.lastAction = 'guide_created';
      })
      .addCase(createShipmentGuide.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      })
      .addCase(cancelGuide.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(cancelGuide.fulfilled, (state) => {
        state.isActioning = false; state.lastAction = 'guide_cancelled';
      })
      .addCase(cancelGuide.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      });
  },
});

export const { clearLogisticsActionState } = logisticsSlice.actions;
export default logisticsSlice.reducer;
