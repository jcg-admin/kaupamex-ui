/**
 * Tests — authCartListener (CR-1/CR-2, ADR-018 hotfix).
 *
 * Al iniciar sesion, el carrito anonimo (X-Cart-Token) debe fusionarse en la
 * cuenta. Antes NADIE disparaba syncCartOnLogin, asi que el carrito se veia
 * vacio tras el login. Este listener lo dispara de forma central (cubre todos
 * los entry-points de login) y luego recarga el carrito del usuario.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { configureStore } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import authReducer, { loginUser } from '@redux/slices/authSlice';
import cartReducer from '@redux/slices/cartSlice';
import authCartMiddleware from './authCartListener';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer, cart: cartReducer },
    middleware: (gdm) => gdm().prepend(authCartMiddleware),
  });

const tick = () => new Promise((r) => setTimeout(r, 30));

afterEach(() => apiService.clearCartToken());

describe('authCartListener', () => {
  it('login con carrito anonimo -> fusiona (POST /cart/merges/ con cart_token)', async () => {
    let mergeBody = null;
    server.use(
      http.post(`${BASE}/api/v2/cart/merges/`, async ({ request }) => {
        mergeBody = await request.json();
        return HttpResponse.json({ items: [], voucher: null });
      }),
      http.get(`${BASE}/api/v2/cart/`, () =>
        HttpResponse.json({ items: [], voucher: null }),
      ),
    );
    apiService.setCartToken('anon-xyz');
    const store = makeStore();

    store.dispatch({ type: loginUser.fulfilled.type, payload: { user: { id: 1 } } });
    await tick();

    expect(mergeBody).toEqual({ cart_token: 'anon-xyz' });
  });

  it('login sin carrito anonimo -> NO fusiona pero carga el carrito', async () => {
    let mergeCalled = false;
    let cartFetched = false;
    server.use(
      http.post(`${BASE}/api/v2/cart/merges/`, async () => {
        mergeCalled = true;
        return HttpResponse.json({ items: [], voucher: null });
      }),
      http.get(`${BASE}/api/v2/cart/`, () => {
        cartFetched = true;
        return HttpResponse.json({ items: [], voucher: null });
      }),
    );
    const store = makeStore();

    store.dispatch({ type: loginUser.fulfilled.type, payload: { user: { id: 1 } } });
    await tick();

    expect(mergeCalled).toBe(false);
    expect(cartFetched).toBe(true);
  });
});
