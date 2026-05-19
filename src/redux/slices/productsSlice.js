/**
 * productsSlice — PracticaYoruba
 *
 * Mutaciones administrativas sobre el catalogo de productos.
 *
 *   UC-CAT-09  — Crear producto       (POST   /api/v1/admin/products/)
 *   UC-CAT-10  — Editar producto      (PATCH  /api/v1/admin/products/:id/)
 *   UC-CAT-11  — Desactivar producto  (POST   /api/v1/admin/products/:id/deactivate/)
 *                Reactivar producto   (POST   /api/v1/admin/products/:id/activate/)
 *
 * La lectura del listado vive en `useAdminProducts` (React Query). Las
 * mutaciones se centralizan aqui para reutilizar `isActioning`,
 * `actionError` y `lastAction`.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const URL_BASE = '/api/v1/admin/products/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-CAT-09: Crear producto. Acepta FormData (con imagenes) u objeto plano. */
export const createProduct = createAsyncThunk(
  'products/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.post(URL_BASE, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CAT-10: Editar producto. */
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(`${URL_BASE}${id}/`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CAT-11: Desactivar producto (idempotente). */
export const deactivateProduct = createAsyncThunk(
  'products/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${URL_BASE}${id}/deactivate/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CAT-11 (alt C): Reactivar producto previamente desactivado. */
export const activateProduct = createAsyncThunk(
  'products/activate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${URL_BASE}${id}/activate/`);
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
  lastAction:  null, // 'created' | 'updated' | 'deactivated' | 'activated'
  lastProduct: null,
};

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductsActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
      state.lastProduct = null;
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
      .addCase(createProduct.pending, startAction)
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'created';
        state.lastProduct = action.payload;
      })
      .addCase(createProduct.rejected, failAction)
      .addCase(updateProduct.pending, startAction)
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'updated';
        state.lastProduct = action.payload;
      })
      .addCase(updateProduct.rejected, failAction)
      .addCase(deactivateProduct.pending, startAction)
      .addCase(deactivateProduct.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'deactivated';
      })
      .addCase(deactivateProduct.rejected, failAction)
      .addCase(activateProduct.pending, startAction)
      .addCase(activateProduct.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'activated';
      })
      .addCase(activateProduct.rejected, failAction);
  },
});

export const { clearProductsActionState } = productsSlice.actions;
export default productsSlice.reducer;
