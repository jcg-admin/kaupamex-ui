/**
 * inventorySlice — PracticaYoruba
 * Gestión de inventario administrativo (UC-INV-01..05)
 *
 *   UC-INV-01 — Ver stock actual de productos (admin)
 *   UC-INV-02 — Decrementar stock al confirmar pago (UI: movimientos SALE)
 *   UC-INV-03 — Restaurar stock al cancelar (UI: movimientos CANCELLATION)
 *   UC-INV-04 — Ajustar stock manualmente (admin)
 *   UC-INV-05 — Importar productos desde CSV
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const STOCK_URL    = '/api/v1/admin/inventory/';
const MOVEMENTS    = (variantId) => `/api/v1/admin/inventory/variants/${variantId}/movements/`;
const ADJUST       = (variantId) => `/api/v1/admin/inventory/variants/${variantId}/adjust/`;
const IMPORT_CSV   = '/api/v1/admin/inventory/import/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-INV-01: lista de stock por variante con filtros (?status=BAJO|AGOTADO|NORMAL). */
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(STOCK_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-INV-02/03: historial de movimientos (SALE / CANCELLATION / MANUAL) de una variante. */
export const fetchStockMovements = createAsyncThunk(
  'inventory/fetchStockMovements',
  async (variantId, { rejectWithValue }) => {
    try {
      const res = await apiService.get(MOVEMENTS(variantId));
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-INV-04: ajusta el stock manualmente con motivo. */
export const adjustStockManually = createAsyncThunk(
  'inventory/adjustStock',
  async ({ variantId, newQuantity, reason, observations = '' }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADJUST(variantId), {
        new_quantity: newQuantity,
        reason,
        observations,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-INV-05: sube un CSV de productos a importar. */
export const importProductsCsv = createAsyncThunk(
  'inventory/importCsv',
  async ({ file, initialState = 'BORRADOR' }, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('initial_state', initialState);
      const res = await apiService.post(IMPORT_CSV, formData);
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
  items:        [],       // listado de stock UC-INV-01
  summary:      null,     // { productos_normales, productos_bajo_stock, productos_agotados }
  movements:    [],       // historial UC-INV-02/03
  importReport: null,     // resultado UC-INV-05
  isLoading:    false,
  isActioning:  false,
  error:        null,
  actionError:  null,
  lastAction:   null,     // 'adjusted' | 'imported'
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,

  reducers: {
    clearInventoryActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
    clearImportReport(state) {
      state.importReport = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchInventory (UC-INV-01)
      .addCase(fetchInventory.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        const results = payload.results ?? payload.productos ?? payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.summary   = payload.summary ?? payload.resumen ?? null;
        state.isLoading = false;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // fetchStockMovements (UC-INV-02/03)
      .addCase(fetchStockMovements.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
        state.movements = [];
      })
      .addCase(fetchStockMovements.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        const results = payload.results ?? payload.movements ?? payload ?? [];
        state.movements = Array.isArray(results) ? results : [];
        state.isLoading = false;
      })
      .addCase(fetchStockMovements.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      // adjustStockManually (UC-INV-04)
      .addCase(adjustStockManually.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(adjustStockManually.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'adjusted';
        const updated = action.payload;
        if (updated?.variant_id != null) {
          state.items = state.items.map((it) =>
            it.variant_id === updated.variant_id
              ? { ...it, stock: updated.new_stock ?? it.stock }
              : it,
          );
        }
      })
      .addCase(adjustStockManually.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      // importProductsCsv (UC-INV-05)
      .addCase(importProductsCsv.pending, (state) => {
        state.isActioning  = true;
        state.actionError  = null;
        state.importReport = null;
      })
      .addCase(importProductsCsv.fulfilled, (state, action) => {
        state.isActioning  = false;
        state.lastAction   = 'imported';
        state.importReport = action.payload ?? null;
      })
      .addCase(importProductsCsv.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  clearInventoryActionState,
  clearImportReport,
} = inventorySlice.actions;

export default inventorySlice.reducer;
