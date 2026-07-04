/**
 * Tests — LoginPage redirect (T-04 / DEC-STF-AUTH-NEXT).
 *
 * Verifica el JOURNEY post-login (lo que la vez pasada NO se verifico y
 * por eso seguia fallando): a donde se redirige segun la entrada.
 *   - ?next= interno  -> esa ruta
 *   - state.from      -> esa pagina
 *   - sin origen      -> fallback (historial / home), NUNCA /account
 *   - ?next= externo  -> rechazado (open-redirect) -> fallback
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import authReducer from '../../redux/slices/authSlice';
import LoginPage from './LoginPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, isAuthenticated: false, isLoading: false, error: null },
    },
  });

const renderLogin = (initialEntries) =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={initialEntries}>
        <LoginPage />
      </MemoryRouter>
    </Provider>,
  );

// La logica de redirect no depende de las credenciales (el mock responde
// 200). Enviamos el form directo (fireEvent.submit no aplica la validacion
// de campos required de jsdom, que bloquearia un click con inputs vacios).
const submit = () => fireEvent.submit(screen.getByTestId('login-submit').closest('form'));

describe('LoginPage redirect (T-04)', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    server.use(
      http.post(`${BASE}/api/v2/auth/login/`, () =>
        HttpResponse.json({ access: 'a', refresh: 'r', user: { id: 1 } }),
      ),
    );
  });

  it('con ?next= interno redirige a esa ruta', async () => {
    renderLogin(['/auth/login?next=/wishlist']);
    submit();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/wishlist', { replace: true }),
    );
  });

  it('con state.from regresa a esa pagina', async () => {
    renderLogin([
      { pathname: '/auth/login', state: { from: { pathname: '/account/orders', search: '' } } },
    ]);
    submit();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/account/orders', { replace: true }),
    );
  });

  it('sin ?next= ni state.from cae al fallback, NUNCA a /account', async () => {
    renderLogin(['/auth/login']);
    submit();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    const [arg] = mockNavigate.mock.calls[mockNavigate.mock.calls.length - 1];
    expect(arg).not.toBe('/account');     // el bug viejo
    expect([-1, '/']).toContain(arg);     // historial o home
  });

  it('rechaza un ?next= externo (open-redirect) y cae al fallback', async () => {
    renderLogin(['/auth/login?next=https://malo.com/phish']);
    submit();
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
    const args = mockNavigate.mock.calls.map((c) => c[0]);
    expect(args).not.toContain('https://malo.com/phish');
    expect(args).not.toContain('/account');
  });

  it('con ?reset=ok muestra el aviso de contraseña actualizada', () => {
    renderLogin(['/auth/login?reset=ok']);
    expect(screen.getByTestId('login-reset-ok')).toBeInTheDocument();
  });

  it('con ?reset=ok tras login va a /account, NO navigate(-1)', async () => {
    // El bug: navigate(-1) devolvia al flujo de recuperacion
    // (reset-password -> forgot-password) y "expulsaba" al usuario.
    renderLogin(['/auth/login?reset=ok']);
    submit();
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith('/account', { replace: true }),
    );
    expect(mockNavigate).not.toHaveBeenCalledWith(-1);
  });
});
