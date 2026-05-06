/**
 * Admin Slice — PracticaYoruba
 * Gestión de usuarios desde el panel admin.
 *
 * Sprint 4:
 *   UC-AUTH-12 — Ver perfil de usuario (Admin)
 *   UC-AUTH-13 — Suspender cuenta de usuario
 *   UC-AUTH-14 — Reactivar cuenta de usuario
 *   UC-AUTH-15 — Crear usuario administrador
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

const ADMIN_USERS_URL = '/api/v1/admin/users/';

// =============================================================================
// Thunks
// =============================================================================

/** UC-AUTH-11: Listar usuarios con búsqueda y paginación */
export const fetchAdminUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_USERS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** UC-AUTH-12: Ver perfil completo de un usuario */
export const fetchAdminUser = createAsyncThunk(
  'admin/fetchUser',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.get(`${ADMIN_USERS_URL}${pk}/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** UC-AUTH-13: Suspender cuenta de usuario */
export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/suspend/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** UC-AUTH-14: Reactivar cuenta de usuario */
export const reactivateUser = createAsyncThunk(
  'admin/reactivateUser',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/reactivate/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** UC-AUTH-15: Crear usuario administrador */
export const createAdminUser = createAsyncThunk(
  'admin/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_USERS_URL, userData);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

// =============================================================================
// Slice
// =============================================================================

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    users:       [],
    currentUser: null,
    pagination: {
      count:      0,
      page:       1,
      pageSize:   20,
      totalPages: 0,
      next:       null,
      previous:   null,
    },
    search: '',

    isLoading:        false,
    isLoadingUser:    false,
    isActioning:      false,   // suspend / reactivate / create
    error:            null,
    userError:        null,
    actionError:      null,
    lastAction:       null,    // 'suspended' | 'reactivated' | 'created'
  },

  reducers: {
    setSearch(state, action) {
      state.search         = action.payload;
      state.pagination.page = 1;
    },
    setPage(state, action) {
      state.pagination.page = action.payload;
    },
    clearCurrentUser(state) {
      state.currentUser = null;
      state.userError   = null;
    },
    clearActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
    },
  },

  extraReducers: (builder) => {
    // fetchAdminUsers
    builder
      .addCase(fetchAdminUsers.pending, (state) => {
        state.isLoading = true;
        state.error     = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        const { results, count, next, previous } = action.payload;
        state.users                  = results ?? [];
        state.pagination.count       = count ?? 0;
        state.pagination.next        = next ?? null;
        state.pagination.previous    = previous ?? null;
        state.pagination.totalPages  = count
          ? Math.ceil(count / state.pagination.pageSize)
          : 0;
        state.isLoading = false;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error     = action.payload;
      });

    // fetchAdminUser
    builder
      .addCase(fetchAdminUser.pending, (state) => {
        state.isLoadingUser = true;
        state.userError     = null;
        state.currentUser   = null;
      })
      .addCase(fetchAdminUser.fulfilled, (state, action) => {
        state.currentUser   = action.payload;
        state.isLoadingUser = false;
      })
      .addCase(fetchAdminUser.rejected, (state, action) => {
        state.isLoadingUser = false;
        state.userError     = action.payload;
      });

    // suspendUser
    builder
      .addCase(suspendUser.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(suspendUser.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'suspended';
        // Actualizar en lista local si existe
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, is_active: false };
        }
      })
      .addCase(suspendUser.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // reactivateUser
    builder
      .addCase(reactivateUser.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(reactivateUser.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'reactivated';
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, is_active: true };
        }
      })
      .addCase(reactivateUser.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // createAdminUser
    builder
      .addCase(createAdminUser.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(createAdminUser.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'created';
        state.users       = [action.payload, ...state.users];
        state.pagination.count += 1;
      })
      .addCase(createAdminUser.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const {
  setSearch, setPage,
  clearCurrentUser, clearActionState,
} = adminSlice.actions;

export default adminSlice.reducer;
