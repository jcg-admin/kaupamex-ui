/**
 * Auth Slice — PracticaYoruba
 *
 * SEGURIDAD:
 *   - NO se guardan tokens en Redux ni en localStorage.
 *   - Los tokens JWT los maneja el backend en httpOnly cookies.
 *   - Solo se guarda la informacion del usuario para mostrar en la UI.
 *
 * Sprint 2: URLs corregidas a /api/v1/, thunks de perfil añadidos.
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

// ─── Thunks — Sprint 1 ────────────────────────────────────────────────

/** Inicia sesion y obtiene tokens JWT. */
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/api/v1/auth/login/', { username, password });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al iniciar sesion');
    }
  }
);

/** Cierra sesion e invalida el refresh token en blacklist. */
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.post('/api/v1/auth/logout/', {});
      return null;
    } catch {
      // Proceder con logout local aunque falle el backend
      return null;
    }
  }
);

/** Registra una nueva cuenta de comprador (is_active=False hasta verificar email). */
export const registerUser = createAsyncThunk(
  'auth/register',
  async (data, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/api/v1/auth/register/', data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// ─── Thunks — Sprint 2 ────────────────────────────────────────────────

/** Obtiene el perfil del comprador autenticado (UC-AUTH-05). */
export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/api/v1/auth/profile/');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

/** Actualiza los datos del perfil (UC-AUTH-06). */
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await apiService.patch('/api/v1/auth/profile/', formData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

/** Cambia la contrasena del comprador autenticado (UC-AUTH-08). */
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword, confirmPassword }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/api/v1/auth/change-password/', {
        current_password: currentPassword,
        new_password:     newPassword,
        confirm_password: confirmPassword,
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
      const response = await apiService.post('/api/v1/auth/verify-email/', {
        token,
      });
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
        '/api/v1/auth/resend-verification/',
        { email },
      );
      return response.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            null,    // { id, email, first_name, last_name, phone, avatar_url,
                              //   is_staff, profile_completeness, pending_fields }
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
        // El registro no inicia sesion automaticamente (is_active=False)
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchProfile (Sprint 2)
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

    // updateProfile (Sprint 2)
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

    // changePassword (Sprint 2)
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
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
