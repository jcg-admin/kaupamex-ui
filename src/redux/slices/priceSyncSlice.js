/**
 * priceSyncSlice — UC-CAT-12.
 *
 * Mutaciones del flujo de sincronizacion de precios del admin.
 * v2: todos los modos van a POST /api/v2/admin/price-syncs/ con
 * { type: 'preview'|'apply', mode: 'csv'|'percentage', ...params }.
 *
 * Cada operacion devuelve `{ session_id, preview: [{ sku, old_price,
 * new_price, diff_pct, product_name }], valid_count, invalid_count }` cuando es
 * preview, o `{ updated_count, message }` cuando es apply. Todos los errores
 * pasan por serializeApiError (DEC-DOC-008 — no silenciar errores).
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const V2_PRICE_SYNCS_URL = '/api/v2/admin/price-syncs/';

export const previewCsv = createAsyncThunk(
  'priceSync/previewCsv',
  async ({ file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'preview');
      formData.append('mode', 'csv');
      const res = await apiService.post(V2_PRICE_SYNCS_URL, formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const applyCsv = createAsyncThunk(
  'priceSync/applyCsv',
  async ({ session_id }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(V2_PRICE_SYNCS_URL, {
        type: 'apply', mode: 'csv', session_id,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const previewPercentage = createAsyncThunk(
  'priceSync/previewPercentage',
  // H-CICLO70-01: the thunk now matches the argument shape dispatched by
  // AdminPriceSyncPage ({ percentage, category, price_min, price_max }) and
  // maps them to the API field names expected by the backend (pct, category_id).
  async ({ percentage, category, price_min, price_max }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(V2_PRICE_SYNCS_URL, {
        type:        'preview',
        mode:        'percentage',
        pct:         percentage,
        category_id: category   || undefined,
        price_min:   price_min  ?? undefined,
        price_max:   price_max  ?? undefined,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const applyPercentage = createAsyncThunk(
  'priceSync/applyPercentage',
  async ({ session_id }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(V2_PRICE_SYNCS_URL, {
        type: 'apply', mode: 'percentage', session_id,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const initialState = {
  isLoading:    false,
  isApplying:   false,
  previewError: null,
  applyError:   null,
  preview:      null,  // { session_id, preview: [], valid_count, invalid_count }
  applyReport:  null,  // { updated_count, message }
  lastAction:   null,  // 'previewed' | 'applied'
};

const priceSyncSlice = createSlice({
  name: 'priceSync',
  initialState,
  reducers: {
    clearPriceSyncState(state) {
      state.previewError = null;
      state.applyError   = null;
      state.preview      = null;
      state.applyReport  = null;
      state.lastAction   = null;
    },
  },
  extraReducers: (builder) => {
    [previewCsv, previewPercentage].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.isLoading    = true;
          state.previewError = null;
          state.preview      = null;
          state.applyReport  = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.isLoading  = false;
          state.preview    = action.payload;
          state.lastAction = 'previewed';
        })
        .addCase(thunk.rejected, (state, action) => {
          state.isLoading    = false;
          state.previewError = action.payload ?? { message: 'Error al generar la vista previa.' };
        });
    });

    [applyCsv, applyPercentage].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.isApplying = true;
          state.applyError = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.isApplying  = false;
          state.applyReport = action.payload;
          state.lastAction  = 'applied';
        })
        .addCase(thunk.rejected, (state, action) => {
          state.isApplying  = false;
          state.applyError  = action.payload ?? { message: 'Error al aplicar los cambios.' };
        });
    });
  },
});

export const { clearPriceSyncState } = priceSyncSlice.actions;
export default priceSyncSlice.reducer;
