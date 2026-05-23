/**
 * Admin Slice — PracticaYoruba
 * Gestión del panel administrativo.
 *
 * Sprint 4:
 *   UC-AUTH-12 — Ver perfil de usuario (Admin)
 *   UC-AUTH-13 — Suspender cuenta de usuario
 *   UC-AUTH-14 — Reactivar cuenta de usuario
 *   UC-AUTH-15 — Crear usuario administrador
 *
 * Sprint 6:
 *   fetchAdminMetrics   — dashboard KPIs (→ /admin/dashboard/)
 *   fetchAdminProducts  — catálogo admin
 *   deleteProduct       — eliminar producto
 *   toggleProductFeatured — destacar / quitar destaque
 *   fetchAdminOrders    — pedidos admin
 *   toggleUserActive    — suspender o reactivar según estado actual
 *   resetUserPassword   — forzar reset de contraseña por email
 *   makeUserAdmin       — promover / degradar rol admin
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';

const ADMIN_USERS_URL    = '/api/v1/admin/users/';
const ADMIN_METRICS_URL  = '/api/v1/admin/dashboard/';
const ADMIN_PRODUCTS_URL = '/api/v1/admin/products/';
const ADMIN_ORDERS_URL   = '/api/v1/admin/orders/';

// =============================================================================
// Thunks — Sprint 4 (users)
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
// Thunks — Sprint 6 (metrics + products + orders + user actions)
// =============================================================================

/** Dashboard KPIs: ventas, pedidos, ticket promedio, usuarios nuevos. */
export const fetchAdminMetrics = createAsyncThunk(
  'admin/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_METRICS_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Listar productos del catálogo con filtros de estado / búsqueda. */
export const fetchAdminProducts = createAsyncThunk(
  'admin/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_PRODUCTS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Eliminar un producto por pk. Devuelve el pk eliminado. */
export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (pk, { rejectWithValue }) => {
    try {
      await apiService.delete(`${ADMIN_PRODUCTS_URL}${pk}/`);
      return pk;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Toggle is_featured (lee estado actual de Redux, luego PATCH). */
export const toggleProductFeatured = createAsyncThunk(
  'admin/toggleProductFeatured',
  async (pk, { getState, rejectWithValue }) => {
    try {
      const products = getState().admin.products;
      const product = products.find((p) => p.id === pk);
      const isFeatured = product ? !product.is_featured : true;
      const res = await apiService.patch(`${ADMIN_PRODUCTS_URL}${pk}/`, {
        is_featured: isFeatured,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Listar pedidos con filtros de estado / búsqueda. */
export const fetchAdminOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_ORDERS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/**
 * Toggle is_active: lee currentUser.is_active y despacha
 * suspendUser o reactivateUser según corresponda.
 */
export const toggleUserActive = createAsyncThunk(
  'admin/toggleUserActive',
  async (pk, { getState, dispatch }) => {
    const isActive = getState().admin.currentUser?.is_active;
    if (isActive) {
      return dispatch(suspendUser(pk));
    }
    return dispatch(reactivateUser(pk));
  }
);

/** Enviar email de restablecimiento de contraseña al usuario. */
export const resetUserPassword = createAsyncThunk(
  'admin/resetUserPassword',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/reset-password/`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

/** Promover o degradar usuario a administrador (toggle is_staff). */
export const makeUserAdmin = createAsyncThunk(
  'admin/makeUserAdmin',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/make-admin/`);
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

    metrics:           {},
    products:          [],
    orders:            [],

    isLoading:         false,
    isLoadingUser:     false,
    isLoadingMetrics:  false,
    isLoadingProducts: false,
    isLoadingOrders:   false,
    isActioning:       false,
    error:             null,
    userError:         null,
    actionError:       null,
    lastAction:        null,
  },

  reducers: {
    setSearch(state, action) {
      state.search          = action.payload;
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

    // fetchAdminMetrics (Sprint 6)
    builder
      .addCase(fetchAdminMetrics.pending, (state) => {
        state.isLoadingMetrics = true;
        state.error = null;
      })
      .addCase(fetchAdminMetrics.fulfilled, (state, action) => {
        state.isLoadingMetrics = false;
        state.metrics = action.payload;
      })
      .addCase(fetchAdminMetrics.rejected, (state, action) => {
        state.isLoadingMetrics = false;
        state.error = action.payload;
      });

    // fetchAdminProducts (Sprint 6)
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.isLoadingProducts = true;
        state.error = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.isLoadingProducts = false;
        const payload = action.payload;
        state.products = payload.results ?? (Array.isArray(payload) ? payload : []);
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.isLoadingProducts = false;
        state.error = action.payload;
      });

    // deleteProduct (Sprint 6)
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isActioning = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // toggleProductFeatured (Sprint 6)
    builder
      .addCase(toggleProductFeatured.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(toggleProductFeatured.fulfilled, (state, action) => {
        state.isActioning = false;
        state.products = state.products.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload } : p
        );
      })
      .addCase(toggleProductFeatured.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // fetchAdminOrders (Sprint 6)
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.isLoadingOrders = true;
        state.error = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.isLoadingOrders = false;
        const payload = action.payload;
        state.orders = payload.results ?? (Array.isArray(payload) ? payload : []);
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.isLoadingOrders = false;
        state.error = action.payload;
      });

    // resetUserPassword (Sprint 6)
    builder
      .addCase(resetUserPassword.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'password_reset_sent';
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // makeUserAdmin (Sprint 6)
    builder
      .addCase(makeUserAdmin.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(makeUserAdmin.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'role_changed';
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, is_staff: action.payload.is_staff };
        }
      })
      .addCase(makeUserAdmin.rejected, (state, action) => {
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
