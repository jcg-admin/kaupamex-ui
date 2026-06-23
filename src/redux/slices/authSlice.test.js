/**
 * Tests — authSlice token lifecycle.
 *
 * Cubre fix-ui-auth-logout-y-refresh-wiring:
 *   - D-17: logoutUser envia {refresh} en body.
 *   - D-23: refreshSession funciona end-to-end.
 *   - D-extra-1: loginUser.fulfilled persiste tokens en apiService.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { configureStore } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';
import apiService from '@services/apiService';
import authReducer, {
  loginUser,
  logoutUser,
  refreshSession,
} from './authSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { auth: authReducer } });

let setAuthTokenSpy, setRefreshTokenSpy, clearTokensSpy;

beforeEach(() => {
  setAuthTokenSpy    = jest.spyOn(apiService, 'setAuthToken');
  setRefreshTokenSpy = jest.spyOn(apiService, 'setRefreshToken');
  clearTokensSpy     = jest.spyOn(apiService, 'clearTokens');
});

afterEach(() => {
  jest.restoreAllMocks();
  apiService.clearTokens(); // Reset token state
});

describe('loginUser persiste tokens (D-extra-1)', () => {
  it('llama setAuthToken + setRefreshToken con los tokens del response', async () => {
    server.use(
      http.post(`${BASE}/api/v1/auth/login/`, () =>
        HttpResponse.json({
          access:  'access-abc',
          refresh: 'refresh-xyz',
          user:    { id: 1, email: 'u@test.mx' },
        }),
      ),
    );
    const store = makeStore();

    await store.dispatch(loginUser({ username: 'u@test.mx', password: 'p' }));

    expect(setAuthTokenSpy).toHaveBeenCalledWith('access-abc');
    expect(setRefreshTokenSpy).toHaveBeenCalledWith('refresh-xyz');
    expect(store.getState().auth.isAuthenticated).toBe(true);
  });
});

describe('logoutUser envia {refresh} en body (D-17)', () => {
  it('lee getRefreshToken + envia en body al endpoint blacklist', async () => {
    apiService.setRefreshToken('refresh-abc');
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/auth/logout/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ detail: 'ok' });
      }),
    );
    const store = makeStore();

    await store.dispatch(logoutUser());

    await waitFor(() =>
      expect(lastBody).toMatchObject({ refresh: 'refresh-abc' }),
    );
    expect(clearTokensSpy).toHaveBeenCalled();
  });

  it('si no hay refresh, envia body vacio pero limpia local', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/auth/logout/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ detail: 'ok' });
      }),
    );
    const store = makeStore();

    await store.dispatch(logoutUser());

    await waitFor(() => expect(lastBody).toEqual({}));
    expect(clearTokensSpy).toHaveBeenCalled();
  });

  it('si backend falla, limpia local igual (resiliencia)', async () => {
    apiService.setRefreshToken('refresh-abc');
    server.use(
      http.post(`${BASE}/api/v1/auth/logout/`, () =>
        HttpResponse.json({ detail: 'error' }, { status: 400 }),
      ),
    );
    const store = makeStore();

    await store.dispatch(logoutUser());

    expect(clearTokensSpy).toHaveBeenCalled();
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });
});

describe('refreshSession actualiza tokens (D-23)', () => {
  it('llama refresh endpoint y actualiza access + refresh (rotation)', async () => {
    apiService.setRefreshToken('refresh-old');
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/auth/refresh/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ access: 'access-new', refresh: 'refresh-new' });
      }),
    );
    const store = makeStore();

    await store.dispatch(refreshSession());

    await waitFor(() =>
      expect(lastBody).toMatchObject({ refresh: 'refresh-old' }),
    );
    expect(setAuthTokenSpy).toHaveBeenCalledWith('access-new');
    expect(setRefreshTokenSpy).toHaveBeenCalledWith('refresh-new');
  });

  it('si no hay refresh, falla sin llamar al endpoint', async () => {
    const store = makeStore();

    const result = await store.dispatch(refreshSession());

    expect(result.type).toBe('auth/refresh/rejected');
  });

  it('si backend rechaza el refresh, limpia tokens y falla', async () => {
    apiService.setRefreshToken('refresh-invalid');
    server.use(
      http.post(`${BASE}/api/v1/auth/refresh/`, () =>
        HttpResponse.json({ detail: 'Token invalid' }, { status: 401 }),
      ),
    );
    const store = makeStore();

    const result = await store.dispatch(refreshSession());

    expect(result.type).toBe('auth/refresh/rejected');
    expect(clearTokensSpy).toHaveBeenCalled();
  });
});
