/**
 * priceSyncSlice — UC-CAT-12.
 *
 * Mutaciones del flujo de sincronizacion de precios del admin:
 *   - previewCsv:          POST /api/v1/admin/price-sync/preview-csv/
 *                          (multipart, sin aplicar cambios)
 *   - applyCsv:            POST /api/v1/admin/price-sync/apply-csv/
 *                          (token retornado por preview, atomico)
 *   - previewPercentage:   POST /api/v1/admin/price-sync/preview-percentage/
 *   - applyPercentage:     POST /api/v1/admin/price-sync/apply-percentage/
 *
 * Cada operacion devuelve `{ rows: [{ sku, current_price, new_price,
 * diff_pct, status }], summary: { valid, invalid }, token }` cuando es
 * preview, o `{ updated, skipped }` cuando es apply. Todos los errores
 * pasan por serializeApiError (DEC-DOC-008 — no silenciar errores).
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const PREVIEW_CSV_URL        = '/api/v1/admin/price-sync/preview-csv/';
const APPLY_CSV_URL          = '/api/v1/admin/price-sync/apply-csv/';
const PREVIEW_PERCENTAGE_URL = '/api/v1/admin/price-sync/preview-percentage/';
const APPLY_PERCENTAGE_URL   = '/api/v1/admin/price-sync/apply-percentage/';

export const previewCsv = createAsyncThunk(
  'priceSync/previewCsv',
  async ({ file }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiService.post(PREVIEW_CSV_URL, formData);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const applyCsv = createAsyncThunk(
  'priceSync/applyCsv',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(APPLY_CSV_URL, { token });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const previewPercentage = createAsyncThunk(
  'priceSync/previewPercentage',
  async ({ percentage, category, price_min, price_max }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(PREVIEW_PERCENTAGE_URL, {
        percentage,
        category:  category  || undefined,
        price_min: price_min || undefined,
        price_max: price_max || undefined,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const applyPercentage = createAsyncThunk(
  'priceSync/applyPercentage',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(APPLY_PERCENTAGE_URL, { token });
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
  preview:      null,  // { rows, summary, token }
  applyReport:  null,  // { updated, skipped }
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
