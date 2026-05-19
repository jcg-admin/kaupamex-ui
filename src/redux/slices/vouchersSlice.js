/**
 * vouchersSlice — PracticaYoruba
 * Gestión de cupones / vouchers desde el panel admin.
 *
 *   UC-PRO-01 — Crear voucher
 *   UC-PRO-02 — Listar / editar vouchers
 *   UC-PRO-03 — Desactivar voucher
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const ADMIN_VOUCHERS_URL = '/api/v1/admin/vouchers/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-PRO-02: Listar vouchers */
export const fetchVouchers = createAsyncThunk(
  'vouchers/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_VOUCHERS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-PRO-01: Crear voucher */
export const createVoucher = createAsyncThunk(
  'vouchers/create',
  async (voucherData, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_VOUCHERS_URL, voucherData);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-PRO-03: Desactivar voucher */
export const deactivateVoucher = createAsyncThunk(
  'vouchers/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_VOUCHERS_URL}${id}/deactivate/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// =============================================================================
// Slice
// =============================================================================

const vouchersSlice = createSlice({
  name: 'vouchers',
  initialState: {
    items:        [],
    isLoading:    false,
    isActioning:  false,
    error:        null,
    actionError:  null,
    lastAction:   null,    // 'created' | 'deactivated'
  },

  reducers: {
    clearVoucherActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },

  extraReducers: (builder) => {
    // fetchVouchers
    builder
      .addCase(fetchVouchers.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchVouchers.fulfilled, (state, action) => {
        const results = action.payload?.results ?? action.payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.isLoading = false;
      })
      .addCase(fetchVouchers.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // createVoucher (UC-PRO-01)
    builder
      .addCase(createVoucher.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(createVoucher.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'created';
        state.items       = [action.payload, ...state.items];
      })
      .addCase(createVoucher.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // deactivateVoucher (UC-PRO-03)
    builder
      .addCase(deactivateVoucher.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(deactivateVoucher.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'deactivated';
        const updated = action.payload;
        state.items   = state.items.map((v) =>
          v.id === updated.id ? { ...v, ...updated } : v
        );
      })
      .addCase(deactivateVoucher.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearVoucherActionState } = vouchersSlice.actions;
export default vouchersSlice.reducer;
