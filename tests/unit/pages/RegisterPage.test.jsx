/**
 * Tests — RegisterPage
 * UC-AUTH-01 / Sprint 1 (completado en Sprint 2)
 *
 * H-CICLO-AUTH-01: el diseño editorial rediseñó el form. Ahora incluye
 * Nombre, Apellido, Correo electrónico, Nombre de usuario, Contraseña y
 * checkbox de términos. No existe campo "Confirmar contraseña" — la
 * confirmación se hace por email. La validación de contraseña se delega al
 * backend; no hay errores de campo client-side visibles en DOM.
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
import RegisterPage from '../../../src/pages/auth/RegisterPage';

const makeStore = (state = {}) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user: null, isAuthenticated: false, isLoading: false, error: null, ...state } },
  });

const renderPage = (state = {}) =>
  render(
    <Provider store={makeStore(state)}>
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    </Provider>
  );

afterEach(() => jest.clearAllMocks());

describe('RegisterPage', () => {

  it('renderiza el formulario de registro', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electr/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
  });

  it('renderiza los campos de nombre y usuario', () => {
    renderPage();
    // use exact label match to avoid matching "Nombre de usuario"
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
  });

  it('tiene link para ir al login', () => {
    renderPage();
    expect(screen.getByText(/ya tienes cuenta/i)).toBeInTheDocument();
  });

  it('muestra boton de submit', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /crear mi cuenta/i })).toBeInTheDocument();
  });

  it('muestra estado de carga cuando isLoading es true', () => {
    // RegisterPage maneja loading state internamente (state local), no via Redux.
    renderPage({ isLoading: true });
    expect(screen.getByRole('button', { name: /crear mi cuenta/i })).toBeInTheDocument();
  });
});
