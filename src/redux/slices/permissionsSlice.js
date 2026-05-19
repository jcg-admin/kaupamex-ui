/**
 * permissionsSlice — UC-ADM-02
 *
 *   updateRolePermissions   PUT  /api/v1/admin/roles/:role/permissions/
 *
 * Listados (roles + permisos) los expone `usePermissions`.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

export const updateRolePermissions = createAsyncThunk(
  'permissions/updateRolePermissions',
  async ({ role, permissions }, { rejectWithValue }) => {
    try {
      const res = await apiService.put(
        `/api/v1/admin/roles/${role}/permissions/`,
        { permissions },
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

const initialState = { isActioning: false, actionError: null, lastAction: null };

const permissionsSlice = createSlice({
  name: 'permissions',
  initialState,
  reducers: {
    clearPermissionsActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateRolePermissions.pending, (state) => {
        state.isActioning = true; state.actionError = null;
      })
      .addCase(updateRolePermissions.fulfilled, (state) => {
        state.isActioning = false; state.lastAction = 'updated';
      })
      .addCase(updateRolePermissions.rejected, (state, action) => {
        state.isActioning = false; state.actionError = action.payload;
      });
  },
});

export const { clearPermissionsActionState } = permissionsSlice.actions;
export default permissionsSlice.reducer;
