/**
 * Tests — AdminUsersPage
 * UC-AUTH-11: Listado de usuarios
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }    from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import adminReducer from '@redux/slices/adminSlice';
import authReducer  from '@redux/slices/authSlice';
import AdminUsersPage from './AdminUsersPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({
    reducer: { admin: adminReducer, auth: authReducer },
  });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

const USERS = [
  { id: 1, username: 'buyer1', email: 'buyer1@test.mx',
    first_name: 'Juan', last_name: 'Perez',
    is_active: true, is_staff: false, email_verified: true,
    date_joined: '2026-01-01T00:00:00Z' },
  { id: 2, username: 'buyer2', email: 'buyer2@test.mx',
    first_name: 'Ana', last_name: 'Lopez',
    is_active: false, is_staff: false, email_verified: false,
    date_joined: '2026-01-02T00:00:00Z' },
];

const pageOf = (results = []) => ({
  results, count: results.length, next: null, previous: null,
});

let lastUrl;

// =============================================================================
describe('AdminUsersPage — listado (UC-AUTH-11)', () => {
  it('muestra el título de la página', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByRole('heading', { name: /Usuarios/i }))
      .toBeInTheDocument();
  });

  it('muestra el campo de búsqueda', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    // input[type=search] has implicit role="searchbox"
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
  });

  it('renderiza la tabla con los usuarios (username visible como @username)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText('@buyer1')).toBeInTheDocument();
    expect(await screen.findByText('@buyer2')).toBeInTheDocument();
  });

  it('muestra email de cada usuario', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText('buyer1@test.mx')).toBeInTheDocument();
  });

  it('indica el estado activo del usuario verificado', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText('Activo')).toBeInTheDocument();
  });

  it('indica el estado inactivo del usuario suspendido', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText('Inactivo')).toBeInTheDocument();
  });

  it('muestra spinner durante la carga', () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => new Promise(() => {})),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it('muestra mensaje si no hay usuarios', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf([]))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText(/Sin usuarios que coincidan/i)).toBeInTheDocument();
  });

  it('cada fila tiene un enlace al detalle del usuario', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    await screen.findByText('@buyer1');
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/admin/usuarios/'));
  });
});

// =============================================================================
describe('AdminUsersPage — búsqueda', () => {
  it('filtra usuarios al escribir en el buscador', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json(pageOf(USERS));
      }),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    const searchbox = await screen.findByRole('searchbox');
    fireEvent.change(searchbox, { target: { value: 'buyer1' } });
    await waitFor(() =>
      expect(lastUrl?.searchParams.get('search')).toBe('buyer1')
    );
  });
});

// =============================================================================
describe('AdminUsersPage — botones de accion', () => {
  it('muestra el botón para crear nuevo admin', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByRole('button', { name: /Nuevo admin/i }))
      .toBeInTheDocument();
  });

  it('muestra el botón exportar CSV', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () => HttpResponse.json(pageOf(USERS))),
    );
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByRole('button', { name: /Exportar CSV/i }))
      .toBeInTheDocument();
  });
});
