/**
 * Tests — AccountPage
 * Hub de la cuenta / Sprint 2
 */

import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../../../src/redux/slices/authSlice';
import AccountPage from '../../../src/pages/account/AccountPage';

const MOCK_USER = {
  id: 1, username: 'demouser', email: 'demo@test.mx',
  first_name: 'Demo', last_name: 'Yoruba',
  profile_completeness: 60, pending_fields: ['avatar', 'addresses'],
};

const renderPage = (user = MOCK_USER) =>
  render(
    <Provider store={configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { user, isAuthenticated: true, isLoading: false, error: null } },
    })}>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </Provider>
  );

describe('AccountPage', () => {

  it('muestra saludo personalizado con el nombre del usuario', () => {
    renderPage();
    expect(screen.getByText(/hola, demo/i)).toBeInTheDocument();
  });

  it('muestra el email del usuario', () => {
    renderPage();
    expect(screen.getByText('demo@test.mx')).toBeInTheDocument();
  });

  it('muestra el link de completar perfil cuando completeness < 100', () => {
    renderPage();
    expect(screen.getByText(/completar ahora/i)).toBeInTheDocument();
  });

  it('no muestra el link de completar cuando completeness es 100', () => {
    renderPage({ ...MOCK_USER, profile_completeness: 100, pending_fields: [] });
    expect(screen.queryByText(/completar ahora/i)).not.toBeInTheDocument();
  });

  it('muestra los links de navegacion de la cuenta', () => {
    renderPage();
    expect(screen.getByText(/mi perfil/i)).toBeInTheDocument();
    expect(screen.getByText(/mis direcciones/i)).toBeInTheDocument();
    expect(screen.getByText(/mis pedidos/i)).toBeInTheDocument();
    expect(screen.getByText(/lista de deseos/i)).toBeInTheDocument();
    expect(screen.getByText(/cambiar contrasena/i)).toBeInTheDocument();
  });

  it('muestra Mi cuenta cuando no hay first_name', () => {
    renderPage({ ...MOCK_USER, first_name: '' });
    expect(screen.getByText(/mi cuenta/i)).toBeInTheDocument();
  });
});
