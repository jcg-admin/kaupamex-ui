/**
 * Tests — VerifyEmailPage (UC-AUTH-10)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
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

const renderPage = (search = '?token=abc123') =>
  render(
    <Provider store={makeStore()}>
      <MemoryRouter initialEntries={[`/auth/verify-email${search}`]}>
        <VerifyEmailPage />
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

  it('muestra mensaje de exito tras verificar', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ status: 'OK' }),
      ),
    );
    renderPage('?token=abc123');
    expect(
      await screen.findByText(/email verificado correctamente/i),
    ).toBeInTheDocument();
  });

  it('muestra link para iniciar sesion cuando el exito', async () => {
    server.use(
      http.post(`${BASE}/api/v2/auth/email-verifications/`, () =>
        HttpResponse.json({ status: 'OK' }),
      ),
    );
    renderPage('?token=abc123');
    expect(
      await screen.findByRole('link', { name: /iniciar sesion/i }),
    ).toBeInTheDocument();
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

  it('muestra error cuando no se proporciona token en la URL', () => {
    renderPage('');
    expect(
      screen.getByText(/enlace de verificacion incompleto/i),
    ).toBeInTheDocument();
  });
});
