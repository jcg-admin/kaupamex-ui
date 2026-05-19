/**
 * productDiscountsSlice — PracticaYoruba
 * Gestión de descuentos de producto (ProductDiscount) desde el panel admin.
 *
 *   UC-DASH-01 — Crear descuento de producto
 *   UC-DASH-02 — Editar descuento de producto
 *   UC-DASH-03 — Desactivar descuento de producto
 *   UC-DASH-04 — Listar descuentos activos (via useProductDiscounts)
 *
 * El listado lo expone `useProductDiscounts` (React Query). Las mutaciones
 * viven aqui para compartir `lastAction` / `actionError` / `isActioning`
 * con el resto de la UI.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const URL_BASE = '/api/v1/admin/product-discounts/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-DASH-01: Crear descuento */
export const createProductDiscount = createAsyncThunk(
  'productDiscounts/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.post(URL_BASE, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-DASH-02: Editar descuento */
export const updateProductDiscount = createAsyncThunk(
  'productDiscounts/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(`${URL_BASE}${id}/`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-DASH-03: Desactivar descuento */
export const deactivateProductDiscount = createAsyncThunk(
  'productDiscounts/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${URL_BASE}${id}/deactivate/`);
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
  isActioning: false,
  actionError: null,
  lastAction:  null, // 'created' | 'updated' | 'deactivated'
};

const productDiscountsSlice = createSlice({
  name: 'productDiscounts',
  initialState,
  reducers: {
    clearProductDiscountsActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },
  extraReducers: (builder) => {
    const startAction = (state) => {
      state.isActioning = true;
      state.actionError = null;
    };
    const failAction = (state, action) => {
      state.isActioning = false;
      state.actionError = action.payload;
    };

    builder
      // createProductDiscount
      .addCase(createProductDiscount.pending, startAction)
      .addCase(createProductDiscount.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'created';
      })
      .addCase(createProductDiscount.rejected, failAction)
      // updateProductDiscount
      .addCase(updateProductDiscount.pending, startAction)
      .addCase(updateProductDiscount.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'updated';
      })
      .addCase(updateProductDiscount.rejected, failAction)
      // deactivateProductDiscount
      .addCase(deactivateProductDiscount.pending, startAction)
      .addCase(deactivateProductDiscount.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'deactivated';
      })
      .addCase(deactivateProductDiscount.rejected, failAction);
  },
});

export const { clearProductDiscountsActionState } = productDiscountsSlice.actions;
export default productDiscountsSlice.reducer;
