/**
 * Tests — VerifyEmailPage (UC-AUTH-10)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import authReducer from '../../redux/slices/authSlice';
import VerifyEmailPage from './VerifyEmailPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { user: null, isAuthenticated: false, isLoading: false, error: null },
    },
  });

// Sonda de ubicacion: expone el pathname actual para asertar redirecciones.
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="loc">{location.pathname}</div>;
}

const renderPage = (search = '?token=abc123') =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[`/auth/verify-email${search}`]}>
        <VerifyEmailPage />
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  );

describe('VerifyEmailPage (UC-AUTH-10)', () => {
  it('llama POST verify-email con el token del query string', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ status: 'OK' });
      }),
    );
    renderPage('?token=abc123');
    await waitFor(() => expect(lastBody).toMatchObject({ token: 'abc123' }));
  });

  it('tras verificar con exito sale de la pantalla de verificacion', async () => {
    // El exito ahora redirige (auto-login), no deja al usuario en /verify-email.
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ isAuthenticated: true, user: { id: 1, email: 'u@x.mx' } }),
      ),
    );
    renderPage('?token=abc123');
    await waitFor(() =>
      expect(screen.getByTestId('loc')).not.toHaveTextContent('verify-email'),
    );
  });

  it('auto-login: redirige a next tras verificar con exito', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ isAuthenticated: true, user: { id: 1, email: 'u@x.mx' } }),
      ),
    );
    renderPage('?token=abc123&next=/checkout');
    await waitFor(() =>
      expect(screen.getByTestId('loc')).toHaveTextContent('/checkout'),
    );
  });

  it('auto-login: redirige a /account si no hay next', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ isAuthenticated: true, user: { id: 1, email: 'u@x.mx' } }),
      ),
    );
    renderPage('?token=abc123');
    await waitFor(() =>
      expect(screen.getByTestId('loc')).toHaveTextContent('/account'),
    );
  });

  it('muestra error cuando el token es invalido o expiro', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ detail: 'Token invalido o expirado' }, { status: 400 }),
      ),
    );
    renderPage('?token=expired');
    expect(
      await screen.findByText(/enlace de verificacion no es valido/i),
    ).toBeInTheDocument();
  });

  it('ofrece reenviar el correo de verificacion en caso de error', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ detail: 'expired' }, { status: 400 }),
      ),
    );
    renderPage('?token=expired');
    await screen.findByText(/enlace de verificacion no es valido/i);
    expect(
      screen.getByRole('button', { name: /reenviar correo/i }),
    ).toBeInTheDocument();
  });

  it('enlace ya utilizado: muestra aviso + login, sin form de reenvio', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json(
          { detail: 'Este enlace ya fue utilizado.', codigo_error: 'TOKEN_ALREADY_USED' },
          { status: 400 },
        ),
      ),
    );
    renderPage('?token=usado&next=/checkout');
    expect(await screen.findByText(/ya fue utilizado/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /iniciar sesion/i }),
    ).toBeInTheDocument();
    // No debe ofrecer reenviar (la cuenta ya esta activa).
    expect(
      screen.queryByRole('button', { name: /reenviar correo/i }),
    ).not.toBeInTheDocument();
  });

  it('al reenviar llama POST resend-verification con el email ingresado', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ detail: 'x' }, { status: 400 }),
      ),
    );
    renderPage('?token=expired');
    await screen.findByText(/enlace de verificacion no es valido/i);

    let resendBody;
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, async ({ request }) => {
        resendBody = await request.json();
        return HttpResponse.json({ status: 'OK' });
      }),
    );

    fireEvent.change(screen.getByLabelText(/correo electronico/i), {
      target: { value: 'demo@test.mx', name: 'email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reenviar correo/i }));

    await waitFor(() => expect(resendBody).toMatchObject({ email: 'demo@test.mx' }));
  });

  it('sin token muestra "revisa tu correo" con aviso de spam', () => {
    renderPage('');
    expect(screen.getByText(/Revisa tu correo/i)).toBeInTheDocument();
    expect(
      screen.getByText(/carpeta de spam/i),
    ).toBeInTheDocument();
  });
});
