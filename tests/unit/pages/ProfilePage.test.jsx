/**
 * Tests — ProfilePage
 * UC-AUTH-05 / UC-AUTH-06 / Sprint 2
 *
 * H-CICLO-PROFILE-01: el componente fue rediseñado como formulario directo
 * (sin toggle read/edit). El heading es "Tu perfil", el formulario muestra
 * Nombre, Apellido, Nombre de usuario (read-only), Correo electrónico
 * (read-only) y Teléfono. Cuando !user → return null (sin texto de loading).
 */

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import { render, screen } from '@testing-library/react';
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

afterEach(() => jest.clearAllMocks());

describe('ProfilePage', () => {

  it('muestra el titulo Tu perfil', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /tu perfil/i })).toBeInTheDocument();
  });

  it('muestra el campo nombre con el valor del usuario', () => {
    renderPage();
    // Field "Nombre" con valor "Demo"
    expect(screen.getByDisplayValue('Demo')).toBeInTheDocument();
  });

  it('muestra el email del usuario como campo de solo lectura', () => {
    renderPage();
    expect(screen.getByDisplayValue('demo@test.mx')).toBeInTheDocument();
  });

  it('muestra el boton Guardar cambios', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('no muestra el boton Editar perfil (diseno directo sin toggle)', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /editar perfil/i })).not.toBeInTheDocument();
  });

  it('no renderiza nada cuando user es null', () => {
    const { container } = render(
      <Provider store={configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: { user: null, isAuthenticated: false, isLoading: true, error: null } },
      })}>
        <MemoryRouter><ProfilePage /></MemoryRouter>
      </Provider>
    );
    expect(container.firstChild).toBeNull();
  });
});
