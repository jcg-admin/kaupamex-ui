/**
 * Tests — authSlice session lifecycle (ADR-018, migracion a sesion).
 *
 * Tras la migracion, la auth del web es la cookie de sesion HttpOnly:
 *   - loginUser NO guarda tokens en apiService (la cookie es la credencial).
 *   - logoutUser cierra la sesion de servidor (POST /auth/session/logout/) y
 *     limpia el cart token local; es resiliente a fallos del backend.
 *   - checkAuth restaura la sesion tras recarga leyendo /auth/session/.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { configureStore } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';
import apiService from '@services/apiService';
import authReducer, {
  loginUser,
  logoutUser,
  checkAuth,
} from './authSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { auth: authReducer } });

describe('loginUser establece sesion sin guardar tokens (ADR-018)', () => {
  it('autentica al usuario y NO expone tokens en apiService', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/login/`, () =>
        HttpResponse.json({
          // El backend aun devuelve tokens (dormidos, futuro movil); el web
          // los ignora — no debe existir metodo para guardarlos.
          access:  'access-abc',
          refresh: 'refresh-xyz',
          user:    { id: 1, email: 'u@test.mx' },
        }),
      ),
    );
    const store = makeStore();

    await store.dispatch(loginUser({ username: 'u@test.mx', password: 'p' }));

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user).toMatchObject({ email: 'u@test.mx' });
    // La API de tokens JWT ya no existe (migracion completa).
    expect(apiService.setAuthToken).toBeUndefined();
    expect(apiService.setRefreshToken).toBeUndefined();
  });
});

describe('logoutUser cierra la sesion de servidor', () => {
  it('llama POST /auth/session/logout/ y limpia el estado', async () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/v2/auth/session/logout/`, () => {
        called = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const store = makeStore();

    await store.dispatch(logoutUser());

    await waitFor(() => expect(called).toBe(true));
    expect(store.getState().auth.isAuthenticated).toBe(false);
  });

  it('si el backend falla, cierra el estado local igual (resiliencia)', async () => {
    apiService.setCartToken('cart-abc');
    server.use(
      http.post(`${BASE}/api/v2/auth/session/logout/`, () =>
        HttpResponse.json({ detail: 'error' }, { status: 500 }),
      ),
    );
    const store = makeStore();

    await store.dispatch(logoutUser());

    expect(store.getState().auth.isAuthenticated).toBe(false);
    // El cart token local se limpia pase lo que pase.
    expect(apiService.getCartToken()).toBeNull();
  });
});

describe('checkAuth restaura la sesion tras recarga', () => {
  it('marca autenticado cuando /auth/session/ reporta sesion activa', async () => {
    server.use(
      http.get(`${BASE}/api/v2/auth/session/`, () =>
        HttpResponse.json({
          isAuthenticated: true,
          user: { id: 7, email: 'reload@test.mx' },
        }),
      ),
    );
    const store = makeStore();

    await store.dispatch(checkAuth());

    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user).toMatchObject({ email: 'reload@test.mx' });
    expect(store.getState().auth.sessionChecked).toBe(true);
  });

  it('marca no autenticado (sin error) cuando no hay sesion', async () => {
    server.use(
      http.get(`${BASE}/api/v2/auth/session/`, () =>
        HttpResponse.json({ isAuthenticated: false, user: null }),
      ),
    );
    const store = makeStore();

    await store.dispatch(checkAuth());

    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.sessionChecked).toBe(true);
  });
});
