/**
 * Auth Slice — PracticaYoruba
 *
 * SEGURIDAD (DEC-AUTH-1, DEC-AUTH-2 de fix-ui-auth-logout-
 * y-refresh-wiring):
 *   - Backend usa JWT Bearer (SIMPLE_JWT.AUTH_HEADER_TYPES).
 *   - Tokens (access + refresh) viven en memory del modulo
 *     apiService. NO en Redux state ni localStorage (XSS-
 *     vulnerable). Trade-off aceptado: reload del browser
 *     pierde la sesion.
 *   - Redux state guarda solo info del usuario para UI.
 *   - Refresh reactivo: interceptor 401 en apiService llama
 *     refreshSession y reintenta. Si refresh falla, dispatch
 *     'py:unauthorized' event que UnauthorizedListener captura.
 *
 * Sprint 2: URLs corregidas a /api/v1/, thunks de perfil añadidos.
 * Sprint 5: address CRUD + logout-all-sessions añadidos.
 * Sprint 6: password reset + avatar upload añadidos.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// ─── URL Constants ───────────────────────────────────────────────────────
const AUTH_URLS = {
  login:                '/api/v1/auth/login/',
  logout:               '/api/v1/auth/logout/',
  refresh:              '/api/v1/auth/refresh/',
  register:             '/api/v1/auth/register/',
  profile:              '/api/v1/auth/profile/',
  changePassword:       '/api/v1/auth/change-password/',
  verifyEmail:          '/api/v1/auth/verify-email/',
  resendVerification:   '/api/v1/auth/resend-verification/',
  deactivate:           '/api/v1/auth/me/deactivate/',
  passwordReset:        '/api/v1/auth/password-reset/',
  passwordResetConfirm: '/api/v1/auth/password-reset/confirm/',
};

const ADDRESSES_URL  = '/api/v1/auth/addresses/';
const ADDRESS_URL    = (id) => `/api/v1/auth/addresses/${id}/`;
const LOGOUT_ALL_URL = '/api/v1/auth/logout-all/';

// ─── Thunks ─── Sprint 1 ─────────────────────────────────────────────

/** Inicia sesion y obtiene tokens JWT. */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await apiService.post(AUTH_URLS.login, { username, password });
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

/**
 * Cierra sesion e invalida el refresh token en blacklist
 * (simplejwt TokenBlacklistView requiere {refresh} en body).
 * Fix D-17 del audit T-102.
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    const refresh = apiService.getRefreshToken();
    try {
      await apiService.post(AUTH_URLS.logout, refresh ? { refresh } : {});
    } catch {
      // Proceder con logout local aunque falle el backend
    } finally {
      apiService.clearTokens();
    }
    return null;
  }
);

/**
 * Refresca el access token usando el refresh actual.
 * Se llama desde el interceptor 401 del apiService o
 * manualmente. Implementacion D-23 del audit T-102.
 * Backend SIMPLE_JWT.ROTATE_REFRESH_TOKENS=True devuelve
 * nuevo refresh tambien (DEC-AUTH-5).
 */
export const refreshSession = createAsyncThunk(
  'auth/refresh',
  async (_, { rejectWithValue }) => {
    const refresh = apiService.getRefreshToken();
    if (!refresh) return rejectWithValue('No refresh token disponible');
    try {
      const response = await apiService.post(AUTH_URLS.refresh, { refresh });
      apiService.setAuthToken(response.data.access);
      if (response.data.refresh) apiService.setRefreshToken(response.data.refresh);
      return response.data;
    } catch (error) {
      apiService.clearTokens();
      return rejectWithValue(serializeApiError(error));
    }
  }
);

/** Registra una nueva cuenta de comprador (is_active=False hasta verificar email). */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiService.post(AUTH_URLS.register, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

// ─── Thunks ─── Sprint 2 ─────────────────────────────────────────────

/** Obtiene el perfil del comprador autenticado (UC-AUTH-05). */
export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get(AUTH_URLS.profile);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

/** Actualiza los datos del perfil (UC-AUTH-06). */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiService.patch(AUTH_URLS.profile, formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

/** Cambia la contrasena del comprador autenticado (UC-AUTH-08). */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      // DEC-AUM-02: API expone new_password_confirm (canon
      // consistente con PasswordResetConfirmSerializer); UI antes
      // enviaba confirm_password = mismatch silencioso.
      const response = await apiService.post(AUTH_URLS.changePassword, {
        current_password:     currentPassword,
        new_password:         newPassword,
        new_password_confirm: confirmPassword,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** Verifica el email del usuario con el token recibido (UC-AUTH-10). */
export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await apiService.post(AUTH_URLS.verifyEmail, { token });
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** Solicita el reenvio del correo de verificacion (UC-AUTH-10 Alt). */
export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (email, { rejectWithValue }) => {
    try {
      const response = await apiService.post(
        AUTH_URLS.resendVerification,
        { email },
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** UC-AUTH-16 — Dar de baja la propia cuenta. Requiere password actual.
 *  Postcondicion API: is_active=False, deactivated_reason='self_deleted',
 *  refresh tokens invalidados.
 *  Postcondicion UI (reducer): user=null, isAuthenticated=false. */
export const deactivateAccount = createAsyncThunk(
  'auth/deactivateAccount',
  async ({ password }, { rejectWithValue }) => {
    try {
      const response = await apiService.post(
        AUTH_URLS.deactivate, { password },
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// ─── Thunks ─── Sprint 5 (address CRUD + logout all) ────────────────────

/** Obtiene la libreta de direcciones del usuario autenticado (UC-AUTH-07). */
export const fetchAddresses = createAsyncThunk(
  'auth/fetchAddresses',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiService.get(ADDRESSES_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** Crea una nueva direccion de envio. */
export const createAddress = createAsyncThunk(
  'auth/createAddress',
  async (data, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADDRESSES_URL, data);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** Elimina una direccion por id. */
export const deleteAddress = createAsyncThunk(
  'auth/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      await apiService.delete(ADDRESS_URL(id));
      return id;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** Marca una direccion como predeterminada. */
export const setDefaultAddress = createAsyncThunk(
  'auth/setDefaultAddress',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiService.post(`${ADDRESS_URL(id)}set-default/`, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** Cierra todas las sesiones activas excepto la actual. */
export const logoutAllSessions = createAsyncThunk(
  'auth/logoutAllSessions',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.post(LOGOUT_ALL_URL, {});
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// ─── Thunks ─── Sprint 6 (password reset + avatar) ──────────────────────

/** Solicita el email de restablecimiento de contraseña (UC-AUTH-09). */
export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async ({ email }, { rejectWithValue }) => {
    try {
      const response = await apiService.post(AUTH_URLS.passwordReset, { email });
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/**
 * Confirma la nueva contraseña con el token del enlace.
 *
 * H-CICLO20-05: el thunk anterior enviaba { uid, token, new_password }.
 * El API (PasswordResetConfirmSerializer) requiere new_password_confirm
 * como campo obligatorio — su ausencia causaba 400 en cada intento de
 * reset. uid no es usado por el serializer (el token es auto-contenido).
 * Se mantiene uid en la firma por compatibilidad con llamadores existentes.
 */
export const confirmPasswordReset = createAsyncThunk(
  'auth/confirmPasswordReset',
  async ({ uid, token, new_password, new_password_confirm }, { rejectWithValue }) => {
    try {
      const response = await apiService.post(AUTH_URLS.passwordResetConfirm, {
        token,
        new_password,
        new_password_confirm: new_password_confirm ?? new_password,
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

/** Sube una nueva foto de perfil (PATCH /auth/profile/ con FormData). */
export const uploadAvatar = createAsyncThunk(
  'auth/uploadAvatar',
  async (file, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const response = await apiService.patch(AUTH_URLS.profile, formData);
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// ─── Slice ───────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            null,
    isAuthenticated: false,
    isLoading:       false,
    error:           null,
  },
  reducers: {
    clearError(state) {
      state.error = null;
    },
    updateUser(state, action) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user ?? action.payload;
        state.error = null;
        if (action.payload.access) apiService.setAuthToken(action.payload.access);
        if (action.payload.refresh) apiService.setRefreshToken(action.payload.refresh);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
      });

    // Logout
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchProfile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    // updateProfile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // changePassword
    builder
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // deactivateAccount
    builder
      .addCase(deactivateAccount.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deactivateAccount.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(deactivateAccount.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchAddresses
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          const { results } = action.payload;
          state.user.addresses = results ?? action.payload;
        }
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // createAddress
    builder
      .addCase(createAddress.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(createAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user.addresses = [...(state.user.addresses || []), action.payload];
        }
      })
      .addCase(createAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // deleteAddress
    builder
      .addCase(deleteAddress.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user?.addresses) {
          state.user.addresses = state.user.addresses.filter(
            (a) => a.id !== action.payload
          );
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // setDefaultAddress
    builder
      .addCase(setDefaultAddress.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user?.addresses) {
          state.user.addresses = state.user.addresses.map((a) => ({
            ...a,
            is_default: a.id === action.payload.id,
          }));
        }
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // logoutAllSessions
    builder
      .addCase(logoutAllSessions.rejected, (state, action) => {
        state.error = action.payload;
      });

    // requestPasswordReset (Sprint 6)
    builder
      .addCase(requestPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // refreshSession (interceptor 401)
    // H-CICLO21-02: si el refresh falla, limpiar el estado de auth para
    // que la UI refleje la sesion expirada. El apiService ya llama
    // clearTokens() y dispara 'py:unauthorized'; aqui cerramos el estado
    // Redux para que isAuthenticated quede en false.
    builder
      .addCase(refreshSession.rejected, (state) => {
        state.user            = null;
        state.isAuthenticated = false;
        state.isLoading       = false;
        state.error           = null;
      });

    // confirmPasswordReset (Sprint 6)
    builder
      .addCase(confirmPasswordReset.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(confirmPasswordReset.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(confirmPasswordReset.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // uploadAvatar (Sprint 6)
    builder
      .addCase(uploadAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.user) {
          state.user = { ...state.user, ...action.payload };
        }
      })
      .addCase(uploadAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
