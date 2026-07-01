/**
 * Auth Slice — PracticaYoruba
 *
 * SEGURIDAD (ADR-018 — migracion a sesion de servidor):
 *   - La auth del web es la cookie de sesion HttpOnly. El navegador la
 *     manda sola (credentials:'same-origin'); sobrevive a la recarga.
 *   - NO hay tokens JWT ni token CSRF en memoria. La defensa CSRF es
 *     SameSite=Strict + __Host- de la cookie de sesion.
 *   - Redux state guarda solo info del usuario para UI.
 *   - 401 = sesion ausente/expirada: apiService dispara 'py:unauthorized'
 *     y UnauthorizedListener cierra el estado y avisa al usuario.
 *
 * Sprint 2: URLs corregidas a /api/v2/, thunks de perfil añadidos.
 * Sprint 5: address CRUD + logout-all-sessions añadidos.
 * Sprint 6: password reset + avatar upload añadidos.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// ─── URL Constants ───────────────────────────────────────────────────────
const AUTH_URLS = {
  login:                '/api/v2/auth/login/',
  // ADR-018: logout = cerrar la sesion de servidor (django_logout borra la
  // fila de sesion). Ya no se usa el blacklist de refresh tokens JWT.
  logout:               '/api/v2/auth/session/logout/',
  register:             '/api/v2/auth/register/',
  me:                   '/api/v2/auth/me/',
  // ADR-018: estado de sesion de servidor (cookie HttpOnly). Restaura la
  // sesion tras recarga; devuelve isAuthenticated + user via la cookie de
  // sesion (auth unica del SPA, sin tokens en memoria).
  session:              '/api/v2/auth/session/',
  profile:              '/api/v2/auth/profile/',
  changePassword:       '/api/v2/auth/change-password/',
  // F5 Tier B: verify + resend merged into one endpoint;
  // dispatch by presence of 'token' key in body.
  verifyEmail:          '/api/v2/auth/email-verifications/',
  resendVerification:   '/api/v2/auth/email-verifications/',
  // F5 Tier B: deactivate is now DELETE /auth/me/ (was POST /me/deactivate/)
  deactivate:           '/api/v2/auth/me/',
  passwordReset:        '/api/v2/auth/password-resets/',
  passwordResetConfirm: '/api/v2/auth/password-resets/confirm/',
};

const ADDRESSES_URL  = '/api/v2/auth/addresses/';
const ADDRESS_URL    = (id) => `/api/v2/auth/addresses/${id}/`;
// F5 Tier B: logout-all is now DELETE /auth/sessions/ (was POST /logout-all/)
const LOGOUT_ALL_URL = '/api/v2/auth/sessions/';

// ─── Thunks ─── Session check ───────────────────────────────────────────

/**
 * Verifica si el usuario ya tiene sesion activa al cargar la app (ADR-018).
 * Llama a /api/v2/auth/session/: la cookie de sesion HttpOnly viaja sola, asi
 * que restaura la sesion tras recargar sin depender de ningun token en memoria.
 * Es la auth unica del SPA; no hay token CSRF (defensa: SameSite=Strict).
 */
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get(AUTH_URLS.session);
      const data = response.data ?? {};
      if (!data.isAuthenticated) return rejectWithValue('no-session');
      return data.user;
    } catch (error) {
      return rejectWithValue(serializeApiError(error));
    }
  }
);

// ─── Thunks ─── Sprint 1 ─────────────────────────────────────────────

/**
 * Inicia sesion (ADR-018): el backend establece la cookie de sesion HttpOnly.
 * No se guardan tokens en memoria — la cookie es la credencial y sobrevive a
 * la recarga. El backend aun devuelve tokens JWT (dormidos, futuro movil); el
 * web los ignora.
 */
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
 * Cierra la sesion de servidor (ADR-018): POST /auth/session/logout/ ejecuta
 * django_logout, que borra la fila de sesion. La cookie deja de autenticar.
 */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await apiService.post(AUTH_URLS.logout, {});
    } catch {
      // Proceder con logout local aunque falle el backend.
    } finally {
      apiService.clearCartToken();
    }
    return null;
  }
);

/** Registra una nueva cuenta de comprador (is_active=False hasta verificar email). */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      // H-CART-01: adjuntar el cart_token anónimo (memory-only) al registro para
      // que el backend fusione el carrito en la cuenta nueva; así sobrevive al
      // enlace de activación (carga de página nueva que borra la memoria).
      const cartToken = apiService.getCartToken?.();
      const payload = cartToken ? { ...data, cart_token: cartToken } : data;
      const response = await apiService.post(AUTH_URLS.register, payload);
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
      const response = await apiService.delete(
        AUTH_URLS.deactivate, { body: { password } },
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
      await apiService.delete(LOGOUT_ALL_URL);
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
    sessionChecked:  false,
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
        state.sessionChecked = true;
        state.user = action.payload.user ?? action.payload;
        state.error = null;
        // ADR-018: la auth es la cookie de sesion; no se guardan tokens.
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
        state.sessionChecked = true;
        state.error = null;
      });

    // checkAuth (session restore on page reload)
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.sessionChecked = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.sessionChecked = true;
        state.user = null;
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

    // verifyEmail — auto-login (ADR-018): si el backend dejo la sesion
    // establecida tras verificar, poblar el estado de auth como en login.
    builder
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload?.isAuthenticated) {
          state.isAuthenticated = true;
          state.sessionChecked  = true;
          state.user            = action.payload.user ?? null;
        }
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
