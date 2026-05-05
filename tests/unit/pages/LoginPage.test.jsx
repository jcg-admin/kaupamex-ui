/**
 * Tests — LoginPage
 * UC-AUTH-02 / Sprint 1 (completado en Sprint 2)
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

describe('LoginPage', () => {

  it('renderiza el formulario de inicio de sesion', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText(/usuario o email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contrasena/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesion/i })).toBeInTheDocument();
  });

  it('muestra error de validacion cuando el username esta vacio', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesion/i }));
    await waitFor(() => {
      expect(screen.getByText(/usuario es obligatorio/i)).toBeInTheDocument();
    });
  });

  it('muestra error de validacion cuando la contrasena esta vacia', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/usuario o email/i), {
      target: { value: 'testuser', name: 'username' },
    });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesion/i }));
    await waitFor(() => {
      expect(screen.getByText(/contrasena es obligatoria/i)).toBeInTheDocument();
    });
  });

  it('limpia el error de campo al escribir', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesion/i }));
    await waitFor(() => screen.getByText(/usuario es obligatorio/i));
    fireEvent.change(screen.getByLabelText(/usuario o email/i), {
      target: { value: 'u', name: 'username' },
    });
    expect(screen.queryByText(/usuario es obligatorio/i)).not.toBeInTheDocument();
  });

  it('tiene link para recuperar contrasena', () => {
    renderPage();
    expect(screen.getByText(/olvide mi contrasena/i)).toBeInTheDocument();
  });

  it('tiene link para crear cuenta', () => {
    renderPage();
    expect(screen.getByText(/crear cuenta/i)).toBeInTheDocument();
  });

  it('muestra estado de carga cuando isLoading es true', () => {
    renderPage({ isLoading: true });
    expect(screen.getByRole('button', { name: /ingresando/i })).toBeDisabled();
  });
});
