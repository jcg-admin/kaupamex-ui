/**
 * backupsSlice — UC-ADM-05
 *
 *   triggerBackup   POST  /api/v1/admin/backups/trigger/
 *
 * Listado lo expone `useBackups`.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

export const triggerBackup = createAsyncThunk(
  'backups/trigger',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.post('/api/v1/admin/backups/trigger/');
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const initialState = { isActioning: false, actionError: null, lastAction: null };

const backupsSlice = createSlice({
  name: 'backups',
  initialState,
  reducers: {
    clearBackupsActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(triggerBackup.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(triggerBackup.fulfilled, (state) => {
        state.isActioning = false; state.lastAction = 'triggered';
      })
      .addCase(triggerBackup.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      });
  },
});

export const { clearBackupsActionState } = backupsSlice.actions;
export default backupsSlice.reducer;
