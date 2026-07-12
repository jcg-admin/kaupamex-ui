/**
 * Tests — AdminUserDetailPage
 * UC-AUTH-12: Ver perfil de usuario
 * UC-AUTH-13: Suspender cuenta
 * UC-AUTH-14: Reactivar cuenta
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }       from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import adminReducer from '@redux/slices/adminSlice';
import authReducer  from '@redux/slices/authSlice';
import AdminUserDetailPage from './AdminUserDetailPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: { admin: adminReducer, auth: authReducer },
  });

const wrap = (pk, store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[`/admin/users/${pk}`]}>
      <Routes>
        <Route path="/admin/users/:pk" element={<AdminUserDetailPage />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

// Party/authz (T-201): email/is_admin/roles — ya no username/is_staff.
const USER_ACTIVE = {
  id: 42, email: 'buyer42@test.mx',
  first_name: 'Juan', last_name: 'García', phone: '',
  is_active: true, is_admin: false, email_verified: true,
  date_joined: '2026-01-15T10:00:00Z',
  roles: [],
};

const USER_INACTIVE = { ...USER_ACTIVE, is_active: false };

// =============================================================================
describe('AdminUserDetailPage — perfil (UC-AUTH-12)', () => {
  beforeEach(() => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => HttpResponse.json(USER_ACTIVE)),
    );
  });

  it('muestra el nombre completo del usuario en el heading', async () => {
    render(wrap(42, makeStore()));
    expect(await screen.findByRole('heading', { name: /Juan García/i })).toBeInTheDocument();
  });

  it('muestra el email del usuario', async () => {
    render(wrap(42, makeStore()));
    expect(await screen.findByText('buyer42@test.mx')).toBeInTheDocument();
  });

  it('muestra el estado activo', async () => {
    render(wrap(42, makeStore()));
    expect(await screen.findByText(/Activo/i)).toBeInTheDocument();
  });

  it('muestra spinner mientras carga', () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => new Promise(() => {})),
    );
    render(wrap(42, makeStore()));
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it('muestra enlace de navegacion de breadcrumb', async () => {
    render(wrap(42, makeStore()));
    await screen.findByText('buyer42@test.mx');
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});

// =============================================================================
describe('AdminUserDetailPage — acciones de cuenta (UC-AUTH-13/14)', () => {
  it('muestra boton Desactivar cuenta si el usuario está activo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => HttpResponse.json(USER_ACTIVE)),
    );
    render(wrap(42, makeStore()));
    expect(await screen.findByRole('button', { name: /Desactivar cuenta/i })).toBeInTheDocument();
  });

  it('no muestra Desactivar cuenta si el usuario ya está inactivo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => HttpResponse.json(USER_INACTIVE)),
    );
    render(wrap(42, makeStore()));
    await screen.findByText('buyer42@test.mx');
    expect(screen.queryByRole('button', { name: /Desactivar cuenta/i })).not.toBeInTheDocument();
  });

  it('muestra boton Activar cuenta si el usuario está inactivo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => HttpResponse.json(USER_INACTIVE)),
    );
    render(wrap(42, makeStore()));
    expect(await screen.findByRole('button', { name: /Activar cuenta/i })).toBeInTheDocument();
  });

  it('no muestra Activar cuenta si el usuario está activo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => HttpResponse.json(USER_ACTIVE)),
    );
    render(wrap(42, makeStore()));
    await screen.findByText('buyer42@test.mx');
    expect(screen.queryByRole('button', { name: /^Activar cuenta$/i })).not.toBeInTheDocument();
  });

  it('llama al API de suspend al hacer clic en Desactivar cuenta', async () => {
    let capturedUrl = null;
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => HttpResponse.json(USER_ACTIVE)),
      http.post(`${BASE}/api/v2/admin/users/42/suspend/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({});
      }),
    );
    render(wrap(42, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Desactivar cuenta/i }));
    await waitFor(() =>
      expect(capturedUrl).toContain('/api/v2/admin/users/42/')
    );
  });

  it('muestra estado Inactivo cuando el usuario está inactivo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () => HttpResponse.json(USER_INACTIVE)),
    );
    render(wrap(42, makeStore()));
    expect(await screen.findByText(/Inactivo/i)).toBeInTheDocument();
  });
});
