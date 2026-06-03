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
import { serializeApiError } from '@utils/serializeApiError';

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
      return rejectWithValue(serializeApiError(err));
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
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-AUTH-13: Suspender cuenta de usuario */
export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/suspend/`, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-AUTH-14: Reactivar cuenta de usuario */
export const reactivateUser = createAsyncThunk(
  'admin/reactivateUser',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/reactivate/`, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
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
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-AUTH-16: Forzar reset de contraseña de un usuario */
export const resetUserPassword = createAsyncThunk(
  'admin/resetUserPassword',
  async (pk, { rejectWithValue }) => {
    try {
      await apiService.post(`${ADMIN_USERS_URL}${pk}/reset-password/`, {});
      return pk;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-AUTH-17: Promover usuario a administrador */
export const makeUserAdmin = createAsyncThunk(
  'admin/makeUserAdmin',
  async (pk, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/make-admin/`, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * UC-ADM-02: Editar permisos de un usuario (is_staff / is_superuser / groups).
 *
 * POST /api/v1/admin/users/:pk/permissions/ con body parcial — solo se
 * envían las claves presentes en `changes`. La API responde el detalle
 * completo del usuario en éxito y con clave `codigo_error` en error
 * (INVALID_PAYLOAD, USER_NOT_FOUND, CANNOT_DEMOTE_SELF). El guard
 * CANNOT_DEMOTE_SELF impide que un admin se quite a sí mismo is_staff /
 * is_superuser (auto-lockout del panel).
 *
 * `serializeApiError` solo propaga `error_code` (canon inglés); como la API
 * usa la clave canónica en español `codigo_error` (DEC-DOC-005), se extrae
 * aquí del cuerpo del error y se adjunta al objeto serializado para que la
 * UI pueda discriminar el caso self-lockout.
 */
export const updateUserPermissions = createAsyncThunk(
  'admin/updateUserPermissions',
  async ({ pk, changes }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_USERS_URL}${pk}/permissions/`, changes);
      return res.data;
    } catch (err) {
      const serialized = serializeApiError(err);
      // createErrorFromResponse expone `codigo_error` (canon) en el error.
      // Como respaldo, `serialized.code` ya recibió ese mismo valor.
      const codigoError = err?.codigo_error ?? serialized.code ?? null;
      if (codigoError) serialized.codigo_error = codigoError;
      return rejectWithValue(serialized);
    }
  }
);

const ADMIN_ORDERS_URL   = '/api/v1/admin/orders/';
const ADMIN_PRODUCTS_URL = '/api/v1/admin/products/';
// H-CICLO95-01: /api/v1/admin/metrics/ never existed — 404 on every load.
// The actual dashboard snapshot is served by DashboardReportView at
// /api/v1/admin/reports/dashboard/ (build_dashboard_payload in apps/reports).
const ADMIN_METRICS_URL  = '/api/v1/admin/reports/dashboard/';

/** UC-ADM-01: KPIs del panel de administración */
export const fetchAdminMetrics = createAsyncThunk(
  'admin/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_METRICS_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-ADM-02: Listar pedidos con filtros */
export const fetchAdminOrders = createAsyncThunk(
  'admin/fetchOrders',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_ORDERS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-ADM-03: Listar productos con filtros */
export const fetchAdminProducts = createAsyncThunk(
  'admin/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADMIN_PRODUCTS_URL, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-ADM-04: Eliminar producto */
export const deleteProduct = createAsyncThunk(
  'admin/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      await apiService.delete(`${ADMIN_PRODUCTS_URL}${id}/`);
      return id;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-ADM-05: Destacar / quitar destacado de un producto */
export const toggleProductFeatured = createAsyncThunk(
  'admin/toggleProductFeatured',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADMIN_PRODUCTS_URL}${id}/toggle-featured/`, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-AUTH-13/14: Activar o desactivar cuenta de usuario (toggle) */
export const toggleUserActive = createAsyncThunk(
  'admin/toggleUserActive',
  async (pk, { getState, rejectWithValue }) => {
    try {
      const user = getState().admin?.currentUser;
      const endpoint = user?.is_active
        ? `${ADMIN_USERS_URL}${pk}/suspend/`
        : `${ADMIN_USERS_URL}${pk}/reactivate/`;
      const res = await apiService.post(endpoint, {});
      return { pk, is_active: !user?.is_active, data: res.data };
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
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

    metrics:          {},
    isLoadingMetrics: false,
    metricsError:     null,

    orders:           [],
    ordersPagination: {
      count:      0,
      next:       null,
      previous:   null,
      totalPages: 0,
    },
    isLoadingOrders:  false,
    ordersError:      null,

    products:         [],
    isLoadingProducts: false,
    productsError:    null,

    isLoading:        false,
    isLoadingUser:    false,
    isActioning:      false,   // suspend / reactivate / create / resetPwd / makeAdmin
    error:            null,
    userError:        null,
    actionError:      null,
    lastAction:       null,    // 'suspended' | 'reactivated' | 'created' | 'password_reset' | 'made_admin'
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

    // resetUserPassword
    builder
      .addCase(resetUserPassword.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(resetUserPassword.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'password_reset';
      })
      .addCase(resetUserPassword.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // makeUserAdmin
    builder
      .addCase(makeUserAdmin.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(makeUserAdmin.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'made_admin';
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, ...action.payload };
        }
      })
      .addCase(makeUserAdmin.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // fetchAdminMetrics
    // H-CICLO95-01: normalize build_dashboard_payload shape
    // {today:{revenue,orders}, trend, top_products, open_tickets, low_stock_alerts}
    // to the flat keys AdminDashboardPage reads.
    builder
      .addCase(fetchAdminMetrics.pending, (state) => {
        state.isLoadingMetrics = true;
        state.metricsError     = null;
      })
      .addCase(fetchAdminMetrics.fulfilled, (state, action) => {
        state.isLoadingMetrics = false;
        const p = action.payload || {};
        const today = p.today || {};
        // Normalize top_products: API returns {product_id,product_name,sku,units_sold}
        // Page reads {id,name,orisha_name,units_sold,revenue}
        const top_products = (p.top_products || []).map((r) => ({
          id:          r.product_id,
          name:        r.product_name,
          orisha_name: r.sku,
          units_sold:  r.units_sold,
          revenue:     null,
        }));
        // Build synthetic alerts from open_tickets and low_stock_alerts counts
        const alerts = [];
        if (p.open_tickets > 0) {
          alerts.push({
            title: `${p.open_tickets} ticket${p.open_tickets > 1 ? 's' : ''} de soporte abierto${p.open_tickets > 1 ? 's' : ''}`,
            description: 'Requieren atención del equipo.',
            severity: 'warning',
            action_to: '/admin/soporte',
          });
        }
        if (p.low_stock_alerts > 0) {
          alerts.push({
            title: `${p.low_stock_alerts} alerta${p.low_stock_alerts > 1 ? 's' : ''} de stock bajo`,
            description: 'Productos por debajo del umbral mínimo.',
            severity: 'warning',
            action_to: '/admin/inventario',
          });
        }
        state.metrics = {
          sales_today:    parseFloat(today.revenue || 0),
          orders_today:   today.orders  || 0,
          avg_ticket:     today.orders > 0
            ? parseFloat(today.revenue || 0) / today.orders
            : 0,
          new_users_today:   null,
          sales_delta_pct:   null,
          orders_delta_pct:  null,
          ticket_delta_pct:  null,
          users_delta_pct:   null,
          recent_orders:     [],
          alerts,
          top_products,
          sales_by_orisha:   [],
          // Raw payload preserved for future consumers
          _raw: p,
        };
      })
      .addCase(fetchAdminMetrics.rejected, (state, action) => {
        state.isLoadingMetrics = false;
        state.metricsError     = action.payload;
      });

    // fetchAdminOrders
    // H-CICLO21-03: la API devuelve respuesta paginada (AdminOrderPagination:
    // 20 por pagina). Antes se descartaban count/next/previous, impidiendo
    // navegar paginas en el panel admin.
    builder
      .addCase(fetchAdminOrders.pending, (state) => {
        state.isLoadingOrders = true;
        state.ordersError     = null;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.isLoadingOrders = false;
        const payload = action.payload;
        if (payload && typeof payload === 'object' && 'results' in payload) {
          state.orders = payload.results ?? [];
          state.ordersPagination = {
            count:      payload.count      ?? 0,
            next:       payload.next       ?? null,
            previous:   payload.previous   ?? null,
            totalPages: payload.count
              ? Math.ceil(payload.count / 20)
              : 0,
          };
        } else {
          state.orders          = payload ?? [];
          state.ordersPagination = { count: 0, next: null, previous: null, totalPages: 0 };
        }
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.isLoadingOrders = false;
        state.ordersError     = action.payload;
      });

    // fetchAdminProducts
    builder
      .addCase(fetchAdminProducts.pending, (state) => {
        state.isLoadingProducts = true;
        state.productsError     = null;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.isLoadingProducts = false;
        state.products          = action.payload?.results ?? action.payload ?? [];
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.isLoadingProducts = false;
        state.productsError     = action.payload;
      });

    // deleteProduct
    builder
      .addCase(deleteProduct.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'deleted_product';
        state.products    = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // toggleProductFeatured
    builder
      .addCase(toggleProductFeatured.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(toggleProductFeatured.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'toggled_featured';
        const idx = state.products.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.products[idx] = action.payload;
      })
      .addCase(toggleProductFeatured.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // updateUserPermissions — UC-ADM-02
    builder
      .addCase(updateUserPermissions.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(updateUserPermissions.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'permissions_updated';
        // La API responde el detalle completo del usuario actualizado.
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, ...action.payload };
        } else {
          state.currentUser = action.payload;
        }
      })
      .addCase(updateUserPermissions.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });

    // toggleUserActive
    builder
      .addCase(toggleUserActive.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(toggleUserActive.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = action.payload.is_active ? 'reactivated' : 'suspended';
        if (state.currentUser) {
          state.currentUser = { ...state.currentUser, is_active: action.payload.is_active };
        }
      })
      .addCase(toggleUserActive.rejected, (state, action) => {
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
