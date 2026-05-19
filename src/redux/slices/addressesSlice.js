/**
 * addressesSlice — PracticaYoruba
 * UC-AUTH-07: Libreta de direcciones de envio del comprador.
 *
 * Mutaciones (crear / actualizar / eliminar / set-default) en este slice.
 * Las lecturas usan useAddresses (React Query).
 *
 * Patron canonico D-010: serializeApiError preserva code / statusCode /
 * validationErrors.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const ADDRESSES_URL  = '/api/v1/auth/addresses/';
const ADDRESS_URL    = (id) => `/api/v1/auth/addresses/${id}/`;
const SET_DEFAULT    = (id) => `/api/v1/auth/addresses/${id}/set-default/`;

// =============================================================================
// Thunks
// =============================================================================

/** UC-AUTH-07: lista direcciones (tambien usada en tests del slice). */
export const fetchAddresses = createAsyncThunk(
  'addresses/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADDRESSES_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-AUTH-07: crea una nueva direccion (Happy Path). */
export const createAddress = createAsyncThunk(
  'addresses/create',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADDRESSES_URL, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-AUTH-07 Alt A: actualiza una direccion existente. */
export const updateAddress = createAsyncThunk(
  'addresses/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await apiService.patch(ADDRESS_URL(id), payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-AUTH-07 Alt B: elimina una direccion. */
export const deleteAddress = createAsyncThunk(
  'addresses/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiService.delete(ADDRESS_URL(id));
      return { id };
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-AUTH-07 Alt C: designa una direccion como predeterminada. */
export const setDefaultAddress = createAsyncThunk(
  'addresses/setDefault',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(SET_DEFAULT(id), {});
      return { id, data: res.data };
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

// =============================================================================
// Slice
// =============================================================================

const initialState = {
  items:       [],
  isLoading:   false,
  isActioning: false,
  error:       null,
  actionError: null,
  lastAction:  null, // 'created' | 'updated' | 'deleted' | 'default'
};

const addressesSlice = createSlice({
  name: 'addresses',
  initialState,

  reducers: {
    clearAddressesActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        const results = payload.results ?? payload ?? [];
        state.items     = Array.isArray(results) ? results : [];
        state.isLoading = false;
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      })

      .addCase(createAddress.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'created';
        if (action.payload) state.items.push(action.payload);
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(updateAddress.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'updated';
        const updated = action.payload;
        if (updated?.id != null) {
          state.items = state.items.map((a) =>
            a.id === updated.id ? { ...a, ...updated } : a,
          );
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(deleteAddress.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'deleted';
        const id = action.payload?.id;
        if (id != null) state.items = state.items.filter((a) => a.id !== id);
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.lastAction = 'default';
        const id = action.payload?.id;
        if (id != null) {
          state.items = state.items.map((a) => ({
            ...a, is_default: a.id === id,
          }));
        }
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.actionError = action.payload;
      });
  },
});

export const { clearAddressesActionState } = addressesSlice.actions;
export default addressesSlice.reducer;
