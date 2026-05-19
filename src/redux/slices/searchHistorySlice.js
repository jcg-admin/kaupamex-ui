/**
 * searchHistorySlice — UC-SRCH-03.
 *
 * Mutaciones del historial de busquedas del comprador autenticado:
 *   - removeSearchHistoryEntry (Alt A — eliminar uno).
 *   - clearSearchHistory       (Alt B — borrar todo).
 *
 * Las lecturas viven en `useSearchHistory` (React Query). Aqui solo
 * existen los thunks que mutan el servidor con errores serializados
 * via serializeApiError (DEC-DOC-008: nunca silenciar errores).
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const HISTORY_URL      = '/api/v1/search/history/';
const HISTORY_ITEM_URL = (id) => `/api/v1/search/history/${id}/`;

export const removeSearchHistoryEntry = createAsyncThunk(
  'searchHistory/removeEntry',
  async (id, { rejectWithValue }) => {
    try {
      await apiService.delete(HISTORY_ITEM_URL(id));
      return { id };
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

export const clearSearchHistory = createAsyncThunk(
  'searchHistory/clearAll',
  async (_arg, { rejectWithValue }) => {
    try {
      await apiService.delete(HISTORY_URL);
      return true;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const searchHistorySlice = createSlice({
  name: 'searchHistory',
  initialState: {
    lastAction:  null,
    actionError: null,
    isMutating:  false,
  },
  reducers: {
    clearActionState(state) {
      state.lastAction  = null;
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(removeSearchHistoryEntry.pending, (state) => {
        state.isMutating  = true;
        state.actionError = null;
      })
      .addCase(removeSearchHistoryEntry.fulfilled, (state) => {
        state.isMutating = false;
        state.lastAction = 'removed';
      })
      .addCase(removeSearchHistoryEntry.rejected, (state, action) => {
        state.isMutating  = false;
        state.actionError = action.payload ?? { message: 'Error al eliminar.' };
      })
      .addCase(clearSearchHistory.pending, (state) => {
        state.isMutating  = true;
        state.actionError = null;
      })
      .addCase(clearSearchHistory.fulfilled, (state) => {
        state.isMutating = false;
        state.lastAction = 'cleared';
      })
      .addCase(clearSearchHistory.rejected, (state, action) => {
        state.isMutating  = false;
        state.actionError = action.payload ?? { message: 'Error al borrar el historial.' };
      });
  },
});

export const { clearActionState } = searchHistorySlice.actions;
export default searchHistorySlice.reducer;
