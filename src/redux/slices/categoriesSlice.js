/**
 * categoriesSlice — PracticaYoruba
 *
 * Mutaciones administrativas sobre el arbol de categorias (UC-CAT-06).
 *
 *   createCategory      POST   /api/v1/admin/categories/
 *   updateCategory      PATCH  /api/v1/admin/categories/:id/
 *   deactivateCategory  POST   /api/v1/admin/categories/:id/deactivate/
 *
 * El listado lo expone `useAdminCategories` (React Query).
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const URL_BASE = '/api/v1/admin/categories/';

export const createCategory = createAsyncThunk(
  'categories/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.post(URL_BASE, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(`${URL_BASE}${id}/`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const deactivateCategory = createAsyncThunk(
  'categories/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${URL_BASE}${id}/deactivate/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const initialState = {
  isActioning: false,
  actionError: null,
  lastAction:  null,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoriesActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },
  extraReducers: (builder) => {
    const startAction = (state) => { state.isActioning = true; state.actionError = null; };
    const failAction  = (state, action) => { state.isActioning = false; state.actionError = action.payload; };
    builder
      .addCase(createCategory.pending, startAction)
      .addCase(createCategory.fulfilled, (state) => { state.isActioning = false; state.lastAction = 'created'; })
      .addCase(createCategory.rejected, failAction)
      .addCase(updateCategory.pending, startAction)
      .addCase(updateCategory.fulfilled, (state) => { state.isActioning = false; state.lastAction = 'updated'; })
      .addCase(updateCategory.rejected, failAction)
      .addCase(deactivateCategory.pending, startAction)
      .addCase(deactivateCategory.fulfilled, (state) => { state.isActioning = false; state.lastAction = 'deactivated'; })
      .addCase(deactivateCategory.rejected, failAction);
  },
});

export const { clearCategoriesActionState } = categoriesSlice.actions;
export default categoriesSlice.reducer;
