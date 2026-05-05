/**
 * Tests — RegisterPage
 * UC-AUTH-01 / Sprint 1 (completado en Sprint 2)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('RegisterPage', () => {

  it('renderiza el formulario de registro', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /crear cuenta/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre de usuario/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contrasena$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contrasena/i)).toBeInTheDocument();
  });

  it('error de validacion: username demasiado corto', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/nombre de usuario/i), {
      target: { value: 'ab', name: 'username' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    await waitFor(() => {
      expect(screen.getByText(/al menos 3 caracteres/i)).toBeInTheDocument();
    });
  });

  it('error de validacion: email invalido', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/nombre de usuario/i), {
      target: { value: 'usuariotest', name: 'username' },
    });
    fireEvent.change(screen.getByLabelText(/^email/i), {
      target: { value: 'correo-sin-arroba', name: 'email' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    await waitFor(() => {
      expect(screen.getByText(/email valido/i)).toBeInTheDocument();
    });
  });

  it('error de validacion: contrasenas no coinciden', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/^contrasena$/i), {
      target: { value: 'Pass1234!', name: 'password' },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contrasena/i), {
      target: { value: 'Diferente!', name: 'password_confirm' },
    });
    fireEvent.click(screen.getByRole('button', { name: /crear cuenta/i }));
    await waitFor(() => {
      expect(screen.getByText(/no coinciden/i)).toBeInTheDocument();
    });
  });

  it('tiene link para ir al login', () => {
    renderPage();
    expect(screen.getByText(/ya tengo cuenta/i)).toBeInTheDocument();
  });

  it('muestra estado de carga cuando isLoading es true', () => {
    renderPage({ isLoading: true });
    expect(screen.getByRole('button', { name: /creando cuenta/i })).toBeDisabled();
  });
});
