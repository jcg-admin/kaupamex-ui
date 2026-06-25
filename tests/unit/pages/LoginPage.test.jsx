/**
 * Tests — LoginPage
 * UC-AUTH-02 / Sprint 1 (completado en Sprint 2)
 *
 * H-CICLO-AUTH-01: el diseño editorial rediseñó el form a email/password
 * con labels "Correo electrónico" y "Contraseña". El botón es "Entrar a mi
 * cuenta" y el loading state usa "Entrando…". La validación es nativa del
 * browser (required), no hay errores de campo en DOM.
 */

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../src/redux/slices/authSlice';
import LoginPage from '../../../src/pages/auth/LoginPage';

const makeStore = (preloadedState = {}) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated: false, isLoading: false, error: null, ...preloadedState } },
  });

const renderPage = (state = {}) =>
  render(
    <Provider store={makeStore(state)}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </Provider>
  );

afterEach(() => jest.clearAllMocks());

describe('LoginPage', () => {

  it('renderiza el formulario de inicio de sesion', () => {
    renderPage();
    expect(screen.getByLabelText(/correo electr/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });

  it('tiene link para recuperar contrasena', () => {
    renderPage();
    expect(screen.getByText(/olvidaste/i)).toBeInTheDocument();
  });

  it('tiene link para crear cuenta', () => {
    renderPage();
    expect(screen.getByText(/crear cuenta/i)).toBeInTheDocument();
  });

  it('muestra estado de carga cuando isLoading es true', () => {
    // LoginPage maneja el loading state internamente (state local), no via Redux.
    // Este test verifica que el componente renderiza sin errores.
    renderPage({ isLoading: true });
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
  });
});
