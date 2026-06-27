/**
 * cardsSlice — Customer Card Management
 *
 * Manages saved payment cards for authenticated users.
 * Cards require email verification before becoming active.
 *
 * UC-PAY-14 — Gestión de tarjetas guardadas
 *
 * Flow: save card → backend creates SavedCard(pending_verification)
 *       → email sent → user clicks link → card becomes active
 *       → appears in checkout card picker
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCustomerCards,
  saveCustomerCard,
  updateCustomerCard,
  deleteCustomerCard,
} from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// =============================================================================
// Thunks
// =============================================================================

export const fetchCustomerCards = createAsyncThunk(
  'cards/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getCustomerCards();
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

export const saveCard = createAsyncThunk(
  'cards/save',
  async (token, { rejectWithValue }) => {
    try {
      const res = await saveCustomerCard(token);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

export const updateCard = createAsyncThunk(
  'cards/update',
  async ({ cardId, data }, { rejectWithValue }) => {
    try {
      const res = await updateCustomerCard(cardId, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

export const deleteCard = createAsyncThunk(
  'cards/delete',
  async (cardId, { rejectWithValue }) => {
    try {
      await deleteCustomerCard(cardId);
      return cardId;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// =============================================================================
// Slice
// =============================================================================

const cardsSlice = createSlice({
  name: 'cards',
  initialState: {
    items:   [],
    loading: false,
    error:   null,
    saveStatus: null,
  },
  reducers: {
    clearSaveStatus(state) {
      state.saveStatus = null;
      state.error      = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchCustomerCards.pending, state => {
        state.loading = true;
        state.error   = null;
      })
      .addCase(fetchCustomerCards.fulfilled, (state, action) => {
        state.loading = false;
        state.items   = action.payload;
      })
      .addCase(fetchCustomerCards.rejected, (state, action) => {
        state.loading = false;
        state.error   = action.payload;
      })

      .addCase(saveCard.pending, state => {
        state.loading    = true;
        state.error      = null;
        state.saveStatus = null;
      })
      .addCase(saveCard.fulfilled, (state, action) => {
        state.loading    = false;
        state.saveStatus = action.payload;
      })
      .addCase(saveCard.rejected, (state, action) => {
        state.loading    = false;
        state.error      = action.payload;
        state.saveStatus = null;
      })

      .addCase(updateCard.fulfilled, (state, action) => {
        const idx = state.items.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateCard.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(deleteCard.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCard.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSaveStatus } = cardsSlice.actions;
export default cardsSlice.reducer;
