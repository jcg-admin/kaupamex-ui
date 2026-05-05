/**
 * Tests — ProfilePage
 * UC-AUTH-05 / UC-AUTH-06 / Sprint 2
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../src/redux/slices/authSlice';
import ProfilePage from '../../../src/pages/account/ProfilePage';

const MOCK_USER = {
  id: 1, username: 'demouser', email: 'demo@test.mx',
  first_name: 'Demo', last_name: 'Yoruba', phone: '5551234567',
  avatar_url: null, profile_completeness: 60,
  pending_fields: ['avatar', 'addresses'],
};

const makeStore = (user = MOCK_USER) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: { user, isAuthenticated: true, isLoading: false, error: null } },
  });

const renderPage = (user = MOCK_USER) =>
  render(
    <Provider store={makeStore(user)}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </Provider>
  );

describe('ProfilePage', () => {

  it('muestra el titulo Mi perfil', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /mi perfil/i })).toBeInTheDocument();
  });

  it('muestra el nombre del usuario', () => {
    renderPage();
    expect(screen.getByText('Demo')).toBeInTheDocument();
  });

  it('muestra el email del usuario', () => {
    renderPage();
    expect(screen.getByText('demo@test.mx')).toBeInTheDocument();
  });

  it('muestra la barra de completitud con el porcentaje correcto', () => {
    renderPage();
    expect(screen.getByText(/60%/)).toBeInTheDocument();
  });

  it('muestra los pending_fields como sugerencia', () => {
    renderPage();
    expect(screen.getByText(/completa tu perfil/i)).toBeInTheDocument();
  });

  it('no muestra pending_fields cuando completeness es 100', () => {
    const completeUser = { ...MOCK_USER, profile_completeness: 100, pending_fields: [] };
    renderPage(completeUser);
    expect(screen.queryByText(/completa tu perfil/i)).not.toBeInTheDocument();
  });

  it('muestra el boton de editar perfil', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
  });

  it('al hacer click en Editar muestra el formulario de edicion', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancelar/i })).toBeInTheDocument();
    });
  });

  it('Cancelar vuelve al modo lectura', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: /editar perfil/i }));
    await waitFor(() => screen.getByRole('button', { name: /cancelar/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
    });
  });

  it('muestra el indicador de carga cuando user es null y isLoading es true', () => {
    render(
      <Provider store={configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: { user: null, isAuthenticated: false, isLoading: true, error: null } },
      })}>
        <MemoryRouter><ProfilePage /></MemoryRouter>
      </Provider>
    );
    expect(screen.getByText(/cargando perfil/i)).toBeInTheDocument();
  });
});
