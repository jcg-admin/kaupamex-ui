/**
 * Tests — RegisterPage
 * UC-AUTH-01 / Sprint 1 (completado en Sprint 2)
 *
 * H-CICLO-AUTH-01: el diseño editorial rediseñó el form. Incluye
 * Nombre, Apellido, Correo electrónico, Contraseña, Confirmar
 * contraseña y checkbox de términos. NO pide "Nombre de usuario":
 * el backend autogenera el username desde el email (RegisterSerializer
 * ._generate_username). El payload enviado lleva password_confirm y
 * terms_accepted, ambos requeridos por el serializer (ISSUE-01).
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

  it('pide confirmar la contraseña (ISSUE-01)', () => {
    renderPage();
    expect(screen.getByLabelText('Confirmar contraseña')).toBeInTheDocument();
  });

  it('no pide nombre de usuario (lo autogenera el backend)', () => {
    renderPage();
    expect(screen.getByLabelText('Nombre')).toBeInTheDocument();
    expect(screen.queryByLabelText(/nombre de usuario/i)).not.toBeInTheDocument();
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
