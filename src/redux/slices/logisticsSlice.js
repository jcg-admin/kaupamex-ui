/**
 * logisticsSlice — UC-LOG-08 (acciones operacionales desde el panel)
 *
 *   confirmDelivery   POST /api/v1/logistics/guides/:guideId/confirm-delivery/
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
        `/api/v1/logistics/guides/${guideId}/confirm-delivery/`,
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const initialState = { isActioning: false, actionError: null, lastAction: null };

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
      });
  },
});

export const { clearLogisticsActionState } = logisticsSlice.actions;
export default logisticsSlice.reducer;
