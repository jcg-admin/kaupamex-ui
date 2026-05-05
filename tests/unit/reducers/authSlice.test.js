/**
 * Tests — authSlice reducer
 * PracticaYoruba UI
 */

import authReducer, {
  clearError,
  updateUser,
  loginUser,
  logoutUser,
} from '../../../src/redux/slices/authSlice';

const INITIAL_STATE = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

describe('authSlice', () => {
  describe('estado inicial', () => {
    it('debe devolver el estado inicial', () => {
      expect(authReducer(undefined, { type: '@@INIT' })).toEqual(INITIAL_STATE);
    });
  });

  describe('clearError', () => {
    it('debe limpiar el error', () => {
      const state = { ...INITIAL_STATE, error: 'Error previo' };
      expect(authReducer(state, clearError()).error).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('debe actualizar los campos del usuario', () => {
      const state = {
        ...INITIAL_STATE,
        user: { id: 1, first_name: 'Ana', last_name: 'García', email: 'ana@test.mx' },
      };
      const next = authReducer(state, updateUser({ first_name: 'María' }));
      expect(next.user.first_name).toBe('María');
      expect(next.user.last_name).toBe('García');
    });

    it('no debe hacer nada si user es null', () => {
      const next = authReducer(INITIAL_STATE, updateUser({ first_name: 'X' }));
      expect(next.user).toBeNull();
    });
  });

  describe('loginUser thunk', () => {
    it('pending — debe poner isLoading en true y limpiar error', () => {
      const action = { type: loginUser.pending.type };
      const next   = authReducer(INITIAL_STATE, action);
      expect(next.isLoading).toBe(true);
      expect(next.error).toBeNull();
    });

    it('fulfilled — debe autenticar y guardar usuario', () => {
      const user   = { id: 1, email: 'test@practicayoruba.mx', is_staff: false };
      const action = { type: loginUser.fulfilled.type, payload: { user } };
      const next   = authReducer(INITIAL_STATE, action);
      expect(next.isAuthenticated).toBe(true);
      expect(next.user).toEqual(user);
      expect(next.isLoading).toBe(false);
      expect(next.error).toBeNull();
    });

    it('fulfilled — acepta payload plano (sin user wrapper)', () => {
      const user   = { id: 2, email: 'otro@test.mx' };
      const action = { type: loginUser.fulfilled.type, payload: user };
      const next   = authReducer(INITIAL_STATE, action);
      expect(next.user).toEqual(user);
      expect(next.isAuthenticated).toBe(true);
    });

    it('rejected — debe limpiar auth y guardar el error', () => {
      const action = { type: loginUser.rejected.type, payload: 'Credenciales inválidas' };
      const next   = authReducer(INITIAL_STATE, action);
      expect(next.isAuthenticated).toBe(false);
      expect(next.user).toBeNull();
      expect(next.error).toBe('Credenciales inválidas');
    });
  });

  describe('logoutUser thunk', () => {
    it('fulfilled — debe limpiar el estado de autenticación', () => {
      const loggedInState = {
        user: { id: 1, email: 'test@test.mx' },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      const action = { type: logoutUser.fulfilled.type };
      const next   = authReducer(loggedInState, action);
      expect(next.user).toBeNull();
      expect(next.isAuthenticated).toBe(false);
    });
  });
});
