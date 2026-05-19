/**
 * settingsSlice — UC-ADM-04
 *
 *   updateSettings   PATCH  /api/v1/admin/settings/
 *
 * La lectura del payload actual la expone `useSystemSettings`.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await apiService.patch('/api/v1/admin/settings/', payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const initialState = { isActioning: false, actionError: null, lastAction: null };

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSettingsActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateSettings.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(updateSettings.fulfilled, (state) => {
        state.isActioning = false; state.lastAction = 'updated';
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      });
  },
});

export const { clearSettingsActionState } = settingsSlice.actions;
export default settingsSlice.reducer;
