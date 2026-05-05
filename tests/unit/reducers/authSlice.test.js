/**
 * Tests — authSlice reducer
 * Sprint 2: thunks de perfil y URLs corregidas
 */

import authReducer, {
  clearError, updateUser,
  loginUser, logoutUser, registerUser,
  fetchProfile, updateProfile, changePassword,
} from '../../../src/redux/slices/authSlice';

const INITIAL_STATE = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const MOCK_USER = {
  id: 1, email: 'test@practicayoruba.mx',
  first_name: 'Demo', last_name: 'Yoruba',
  is_staff: false, profile_completeness: 60,
  pending_fields: ['avatar', 'addresses'],
};

describe('authSlice', () => {

  describe('estado inicial', () => {
    it('devuelve el estado inicial', () => {
      expect(authReducer(undefined, { type: '@@INIT' })).toEqual(INITIAL_STATE);
    });
  });

  describe('clearError', () => {
    it('limpia el error', () => {
      const state = { ...INITIAL_STATE, error: 'Error previo' };
      expect(authReducer(state, clearError()).error).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('actualiza campos del usuario', () => {
      const state = { ...INITIAL_STATE, user: { id: 1, first_name: 'Ana' } };
      const next = authReducer(state, updateUser({ first_name: 'Maria' }));
      expect(next.user.first_name).toBe('Maria');
    });

    it('no hace nada si user es null', () => {
      const next = authReducer(INITIAL_STATE, updateUser({ first_name: 'X' }));
      expect(next.user).toBeNull();
    });
  });

  describe('loginUser', () => {
    it('pending — isLoading=true, error=null', () => {
      const next = authReducer(INITIAL_STATE, { type: loginUser.pending.type });
      expect(next.isLoading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled — autentica y guarda usuario (con wrapper)', () => {
      const next = authReducer(INITIAL_STATE, {
        type: loginUser.fulfilled.type,
        payload: { user: MOCK_USER },
      });
      expect(next.isAuthenticated).toBe(true);
      expect(next.user).toEqual(MOCK_USER);
      expect(next.isLoading).toBe(false);
      expect(next.error).toBeNull();
    });

    it('fulfilled — acepta payload plano sin wrapper', () => {
      const next = authReducer(INITIAL_STATE, {
        type: loginUser.fulfilled.type,
        payload: MOCK_USER,
      });
      expect(next.user).toEqual(MOCK_USER);
      expect(next.isAuthenticated).toBe(true);
    });

    it('rejected — limpia auth y guarda error', () => {
      const next = authReducer(INITIAL_STATE, {
        type: loginUser.rejected.type,
        payload: 'Credenciales invalidas',
      });
      expect(next.isAuthenticated).toBe(false);
      expect(next.user).toBeNull();
      expect(next.error).toBe('Credenciales invalidas');
    });
  });

  describe('logoutUser', () => {
    it('fulfilled — limpia el estado de autenticacion', () => {
      const loggedIn = { user: MOCK_USER, isAuthenticated: true, isLoading: false, error: null };
      const next = authReducer(loggedIn, { type: logoutUser.fulfilled.type });
      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
    });
  });

  describe('registerUser', () => {
    it('pending — isLoading=true', () => {
      const next = authReducer(INITIAL_STATE, { type: registerUser.pending.type });
      expect(next.isLoading).toBe(true);
    });

    it('fulfilled — NO autentica (is_active=False en backend)', () => {
      const next = authReducer(INITIAL_STATE, { type: registerUser.fulfilled.type });
      expect(next.isAuthenticated).toBe(false);
      expect(next.isLoading).toBe(false);
    });

    it('rejected — guarda el error', () => {
      const next = authReducer(INITIAL_STATE, {
        type: registerUser.rejected.type,
        payload: { email: 'El email ya existe' },
      });
      expect(next.error).toEqual({ email: 'El email ya existe' });
    });
  });

  describe('fetchProfile (Sprint 2)', () => {
    it('pending — isLoading=true', () => {
      const next = authReducer(INITIAL_STATE, { type: fetchProfile.pending.type });
      expect(next.isLoading).toBe(true);
    });

    it('fulfilled — hidrata el estado con el perfil completo', () => {
      const next = authReducer(INITIAL_STATE, {
        type: fetchProfile.fulfilled.type,
        payload: MOCK_USER,
      });
      expect(next.isAuthenticated).toBe(true);
      expect(next.user).toEqual(MOCK_USER);
      expect(next.user.profile_completeness).toBe(60);
      expect(next.user.pending_fields).toEqual(['avatar', 'addresses']);
    });

    it('rejected — limpia auth', () => {
      const loggedIn = { user: MOCK_USER, isAuthenticated: true, isLoading: true, error: null };
      const next = authReducer(loggedIn, { type: fetchProfile.rejected.type });
      expect(next.isAuthenticated).toBe(false);
      expect(next.user).toBeNull();
    });
  });

  describe('updateProfile (Sprint 2)', () => {
    it('fulfilled — actualiza campos del usuario sin reemplazar todo', () => {
      const state = { ...INITIAL_STATE, user: MOCK_USER, isAuthenticated: true };
      const patch = { first_name: 'Nuevo', phone: '5550000001' };
      const next = authReducer(state, {
        type: updateProfile.fulfilled.type,
        payload: patch,
      });
      expect(next.user.first_name).toBe('Nuevo');
      expect(next.user.phone).toBe('5550000001');
      expect(next.user.email).toBe(MOCK_USER.email);
    });

    it('rejected — guarda el error', () => {
      const next = authReducer(INITIAL_STATE, {
        type: updateProfile.rejected.type,
        payload: { avatar: 'Formato invalido' },
      });
      expect(next.error).toEqual({ avatar: 'Formato invalido' });
    });
  });

  describe('changePassword (Sprint 2)', () => {
    it('pending — isLoading=true', () => {
      const next = authReducer(INITIAL_STATE, { type: changePassword.pending.type });
      expect(next.isLoading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled — isLoading=false, sin cambios en user', () => {
      const state = { ...INITIAL_STATE, user: MOCK_USER, isAuthenticated: true };
      const next = authReducer(state, { type: changePassword.fulfilled.type });
      expect(next.isLoading).toBe(false);
      expect(next.user).toEqual(MOCK_USER);
    });

    it('rejected — guarda el error', () => {
      const next = authReducer(INITIAL_STATE, {
        type: changePassword.rejected.type,
        payload: { current_password: 'Contrasena actual incorrecta' },
      });
      expect(next.error).toEqual({ current_password: 'Contrasena actual incorrecta' });
    });
  });
});
