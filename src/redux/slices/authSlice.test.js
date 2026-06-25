/**
 * Tests — authSlice token lifecycle.
 *
 * Cubre fix-ui-auth-logout-y-refresh-wiring:
 *   - D-17: logoutUser envia {refresh} en body.
 *   - D-23: refreshSession funciona end-to-end.
 *   - D-extra-1: loginUser.fulfilled persiste tokens en apiService.
 */
import { configureStore } from '@reduxjs/toolkit';

// Mock con metodos de storage stub (set/get/clearTokens).
jest.mock('@services/apiService', () => {
  const tokens = { access: null, refresh: null };
  return {
    __esModule: true,
    default: {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      setAuthToken: jest.fn((t) => { tokens.access = t || null; }),
      setRefreshToken: jest.fn((t) => { tokens.refresh = t || null; }),
      getRefreshToken: jest.fn(() => tokens.refresh),
      clearTokens: jest.fn(() => { tokens.access = null; tokens.refresh = null; }),
      __resetTokens: () => { tokens.access = null; tokens.refresh = null; },
    },
  };
});

import apiService from '@services/apiService';
import authReducer, {
  loginUser,
  logoutUser,
  refreshSession,
} from './authSlice';

const makeStore = () =>
  configureStore({ reducer: { auth: authReducer } });

afterEach(() => {
  jest.clearAllMocks();
  apiService.__resetTokens();
});

describe('loginUser persiste tokens (D-extra-1)', () => {
  it('llama setAuthToken + setRefreshToken con los tokens del response', async () => {
    apiService.post.mockResolvedValue({
      data: {
        access:  'access-abc',
        refresh: 'refresh-xyz',
        user:    { id: 1, email: 'u@test.mx' },
      },
    });
    const store = makeStore();

    await store.dispatch(loginUser({ username: 'u@test.mx', password: 'p' }));

    expect(apiService.setAuthToken).toHaveBeenCalledWith('access-abc');
    expect(apiService.setRefreshToken).toHaveBeenCalledWith('refresh-xyz');
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });
});

describe('logoutUser envia {refresh} en body (D-17)', () => {
  it('lee getRefreshToken + envia en body al endpoint blacklist', async () => {
    apiService.setRefreshToken('refresh-abc');
    apiService.post.mockResolvedValue({ data: {} });
    const store = makeStore();

    await store.dispatch(logoutUser());

    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v2/auth/logout/',
      { refresh: 'refresh-abc' },
    );
    expect(apiService.clearTokens).toHaveBeenCalled();
  });

  it('si no hay refresh, envia body vacio pero limpia local', async () => {
    apiService.post.mockResolvedValue({ data: {} });
    const store = makeStore();

    await store.dispatch(logoutUser());

    expect(apiService.post).toHaveBeenCalledWith('/api/v2/auth/logout/', {});
    expect(apiService.clearTokens).toHaveBeenCalled();
  });

  it('si backend falla, limpia local igual (resiliencia)', async () => {
    apiService.setRefreshToken('refresh-abc');
    apiService.post.mockRejectedValue(new Error('Backend down'));
    const store = makeStore();

    await store.dispatch(logoutUser());

    expect(apiService.clearTokens).toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});

describe('refreshSession actualiza tokens (D-23)', () => {
  it('llama refresh endpoint y actualiza access + refresh (rotation)', async () => {
    apiService.setRefreshToken('refresh-old');
    apiService.post.mockResolvedValue({
      data: { access: 'access-new', refresh: 'refresh-new' },
    });
    const store = makeStore();

    await store.dispatch(refreshSession());

    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v2/auth/refresh/',
      { refresh: 'refresh-old' },
    );
    expect(apiService.setAuthToken).toHaveBeenCalledWith('access-new');
    expect(apiService.setRefreshToken).toHaveBeenCalledWith('refresh-new');
  });

  it('si no hay refresh, falla sin llamar al endpoint', async () => {
    const store = makeStore();

    const result = await store.dispatch(refreshSession());

    expect(result.type).toBe('auth/refresh/rejected');
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('si backend rechaza el refresh, limpia tokens y falla', async () => {
    apiService.setRefreshToken('refresh-invalid');
    apiService.post.mockRejectedValue(new Error('Token invalid'));
    const store = makeStore();

    const result = await store.dispatch(refreshSession());

    expect(result.type).toBe('auth/refresh/rejected');
    expect(apiService.clearTokens).toHaveBeenCalled();
  });
});
