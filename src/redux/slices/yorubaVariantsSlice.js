/**
 * yorubaVariantsSlice — PracticaYoruba
 * Estado de variantes Yoruba (Orisha/saints/configuraciones rituales):
 *
 *   UC-CHT-01 — Ver variantes disponibles del producto (Visitante)
 *   UC-CHT-02 — Seleccionar variante al agregar al carrito (Visitante)
 *   UC-CHT-03 — Gestionar variantes (Admin)
 *   UC-CHT-04 — Precio diferenciado por variante (Admin)
 *
 * Conceptos del dominio:
 *   - "Variante" = combinacion concreta (Tamano: Grande, Material: Cobre) con
 *     stock y posible precio diferenciado. Ej.: collar de Yemayá tamaño grande.
 *   - "Tipo de variante" = atributo (Tamano, Presentacion, Material).
 *   - Aunque las identidades del dominio Yoruba (Yemayá, Ogún, Oshún) son
 *     nombres del producto, las variantes describen la presentación física.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const ADMIN_VARIANTS_URL = (productId) => `/api/v1/admin/products/${productId}/variants/`;
const ADMIN_VARIANT_PRICE_URL = (variantId) => `/api/v1/admin/variants/${variantId}/price/`;

// =============================================================================
// Thunks (Admin)
// =============================================================================

/** UC-CHT-03: lista de variantes de un producto desde el panel admin. */
export const fetchAdminVariants = createAsyncThunk(
  'yorubaVariants/fetchAdminVariants',
  async (productId, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_VARIANTS_URL(productId));
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CHT-03: crea una nueva variante (tipo + opcion + stock inicial). */
export const createVariant = createAsyncThunk(
  'yorubaVariants/createVariant',
  async ({ productId, variantType, optionName, initialStock = 0 }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_VARIANTS_URL(productId), {
        variant_type: variantType,
        option_name:  optionName,
        initial_stock: initialStock,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CHT-03: activa o desactiva una variante existente. */
export const toggleVariantActive = createAsyncThunk(
  'yorubaVariants/toggleActive',
  async ({ productId, variantId, isActive }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(
        `${ADMIN_VARIANTS_URL(productId)}${variantId}/`,
        { is_active: isActive },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CHT-04: configura el precio diferenciado de una variante. */
export const setVariantPrice = createAsyncThunk(
  'yorubaVariants/setPrice',
  async ({ variantId, price }, { rejectWithValue }) => {
    try {
      const res = await apiService.put(ADMIN_VARIANT_PRICE_URL(variantId), {
        price,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-CHT-04: quita el precio diferenciado (vuelve al precio base). */
export const clearVariantPrice = createAsyncThunk(
  'yorubaVariants/clearPrice',
  async (variantId, { rejectWithValue }) => {
    try {
      const res = await apiService.delete(ADMIN_VARIANT_PRICE_URL(variantId));
      return { variant_id: variantId, data: res.data };
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

// =============================================================================
// Slice
// =============================================================================

const initialState = {
  selectedVariantId: null,   // UC-CHT-01/02: variante elegida por el visitante
  adminVariants:     [],     // UC-CHT-03: variantes del producto (admin)
  isLoading:         false,
  isActioning:       false,
  error:             null,
  actionError:       null,
  lastAction:        null,   // 'created' | 'toggled' | 'priced' | 'price_cleared'
};

const yorubaVariantsSlice = createSlice({
  name: 'yorubaVariants',
  initialState,

  reducers: {
    /** UC-CHT-01: selecciona una variante en la ficha de producto. */
    selectVariant(state, action) {
      state.selectedVariantId = action.payload;
    },
    clearSelectedVariant(state) {
      state.selectedVariantId = null;
    },
    clearVariantActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminVariants.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchAdminVariants.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        const results = payload.results ?? payload.variantes ?? payload ?? [];
        state.adminVariants = Array.isArray(results) ? results : [];
        state.isLoading     = false;
      })
      .addCase(fetchAdminVariants.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      .addCase(createVariant.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(createVariant.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'created';
        if (action.payload) state.adminVariants.push(action.payload);
      })
      .addCase(createVariant.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(toggleVariantActive.fulfilled, (state, action) => {
        state.lastAction = 'toggled';
        const updated = action.payload;
        if (updated?.id != null) {
          state.adminVariants = state.adminVariants.map((v) =>
            v.id === updated.id ? { ...v, ...updated } : v,
          );
        }
      })
      .addCase(toggleVariantActive.rejected, (state, action) => {
        state.actionError = action.payload;
      })

      .addCase(setVariantPrice.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(setVariantPrice.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'priced';
        const updated = action.payload;
        if (updated?.id != null) {
          state.adminVariants = state.adminVariants.map((v) =>
            v.id === updated.id ? { ...v, ...updated } : v,
          );
        }
      })
      .addCase(setVariantPrice.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(clearVariantPrice.fulfilled, (state, action) => {
        state.lastAction = 'price_cleared';
        const id = action.payload?.variant_id;
        if (id != null) {
          state.adminVariants = state.adminVariants.map((v) =>
            v.id === id ? { ...v, price: null } : v,
          );
        }
      });
  },
});

export const {
  selectVariant,
  clearSelectedVariant,
  clearVariantActionState,
} = yorubaVariantsSlice.actions;

export default yorubaVariantsSlice.reducer;
