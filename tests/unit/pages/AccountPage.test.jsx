/**
 * Tests — AccountPage
 * Hub de la cuenta / Sprint 2
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
import ordersReducer from '../../../src/redux/slices/ordersSlice';
import AccountPage from '../../../src/pages/account/AccountPage';

const MOCK_USER = {
  id: 1, username: 'demouser', email: 'demo@test.mx',
  first_name: 'Demo', last_name: 'Yoruba',
  profile_completeness: 60, pending_fields: ['avatar', 'addresses'],
  date_joined: '2024-01-01T00:00:00Z',
};

const renderPage = (user = MOCK_USER) =>
  render(
    <Provider store={configureStore({
      reducer: { auth: authReducer, orders: ordersReducer },
      preloadedState: { auth: { user, isAuthenticated: true, isLoading: false, error: null } },
    })}>
      <MemoryRouter>
        <AccountPage />
      </MemoryRouter>
    </Provider>
  );

afterEach(() => jest.clearAllMocks());

describe('AccountPage', () => {

  it('muestra saludo personalizado con el nombre del usuario', () => {
    renderPage();
    expect(screen.getByText(/hola, demo/i)).toBeInTheDocument();
  });

  it('muestra el email del usuario', () => {
    renderPage();
    // email is rendered inline with order count: "demo@test.mx · N pedidos"
    expect(screen.getByText(/demo@test\.mx/)).toBeInTheDocument();
  });

  it('muestra el link de completar perfil cuando completeness < 100', () => {
    renderPage();
    // button text is "Completar perfil"
    expect(screen.getByText(/completar perfil/i)).toBeInTheDocument();
  });

  it('no muestra el link de completar cuando completeness es 100', () => {
    renderPage({ ...MOCK_USER, profile_completeness: 100, pending_fields: [] });
    expect(screen.queryByText(/completar perfil/i)).not.toBeInTheDocument();
  });

  it('muestra los links de navegacion de la cuenta', () => {
    renderPage();
    // AccountSidebar labels: Datos personales, Mis direcciones, Mis pedidos, Lista de deseos, Seguridad
    // Some items appear more than once (sidebar + hub tile), so use getAllByText
    expect(screen.getAllByText(/datos personales/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/mis direcciones/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/mis pedidos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/lista de deseos/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/seguridad/i).length).toBeGreaterThan(0);
  });

  it('muestra saludo sin nombre cuando no hay first_name', () => {
    renderPage({ ...MOCK_USER, first_name: '' });
    // heading shows "Hola, " (empty name)
    expect(screen.getByRole('heading', { level: 1, name: /hola/i })).toBeInTheDocument();
  });
});
