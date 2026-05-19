/**
 * Tests — VerifyEmailPage (UC-AUTH-10)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(),
    patch: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';
import authReducer from '../../redux/slices/authSlice';
import VerifyEmailPage from './VerifyEmailPage';

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

afterEach(() => jest.clearAllMocks());

describe('VerifyEmailPage (UC-AUTH-10)', () => {
  it('llama POST verify-email con el token del query string', async () => {
    apiService.post.mockResolvedValue({ data: { status: 'OK' } });
    renderPage('?token=abc123');
    await waitFor(() => expect(apiService.post).toHaveBeenCalledWith(
      '/api/v1/auth/verify-email/',
      { token: 'abc123' },
    ));
  });

  it('muestra mensaje de exito tras verificar', async () => {
    apiService.post.mockResolvedValue({ data: { status: 'OK' } });
    renderPage('?token=abc123');
    expect(
      await screen.findByText(/email verificado correctamente/i),
    ).toBeInTheDocument();
  });

  it('muestra link para iniciar sesion cuando el exito', async () => {
    apiService.post.mockResolvedValue({ data: { status: 'OK' } });
    renderPage('?token=abc123');
    expect(
      await screen.findByRole('link', { name: /iniciar sesion/i }),
    ).toBeInTheDocument();
  });

  it('muestra error cuando el token es invalido o expiro', async () => {
    apiService.post.mockRejectedValue({
      code: 'TOKEN_INVALID',
      status: 400,
      message: 'Token invalido o expirado',
    });
    renderPage('?token=expired');
    expect(
      await screen.findByText(/enlace de verificacion no es valido/i),
    ).toBeInTheDocument();
  });

  it('ofrece reenviar el correo de verificacion en caso de error', async () => {
    apiService.post.mockRejectedValue({
      code: 'TOKEN_INVALID', status: 400, message: 'expired',
    });
    renderPage('?token=expired');
    await screen.findByText(/enlace de verificacion no es valido/i);
    expect(
      screen.getByRole('button', { name: /reenviar correo/i }),
    ).toBeInTheDocument();
  });

  it('al reenviar llama POST resend-verification con el email ingresado', async () => {
    apiService.post.mockRejectedValueOnce({
      code: 'TOKEN_INVALID', status: 400, message: 'x',
    });
    apiService.post.mockResolvedValueOnce({ data: { status: 'OK' } });
    renderPage('?token=expired');
    await screen.findByText(/enlace de verificacion no es valido/i);

    fireEvent.change(screen.getByLabelText(/correo electronico/i), {
      target: { value: 'demo@test.mx', name: 'email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reenviar correo/i }));

    await waitFor(() => expect(apiService.post).toHaveBeenLastCalledWith(
      '/api/v1/auth/resend-verification/',
      { email: 'demo@test.mx' },
    ));
  });

  it('muestra error cuando no se proporciona token en la URL', () => {
    renderPage('');
    expect(
      screen.getByText(/enlace de verificacion incompleto/i),
    ).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });
});
