/**
 * Tests adicionales — AdminUsersPage (UC-ADM-01, party/authz T-201)
 *
 * Cubre filtros de rol y estado del listado de usuarios. Rol -> `is_admin`
 * (party/authz: admin = titular del rol superadmin), no `is_staff`.
 * El listado base lo cubre AdminUsersPage.test.jsx.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import adminReducer from '@redux/slices/adminSlice';
import AdminUsersPage from './AdminUsersPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const USERS = [
  { id: 1, email: 'c1@yoruba.mx',
    first_name: 'Carlos', last_name: 'Uno',
    is_admin: false, is_active: true, email_verified: true,
    date_joined: '2026-01-10T00:00:00Z' },
  { id: 2, email: 'a1@yoruba.mx',
    first_name: 'Admin', last_name: 'Uno',
    is_admin: true, is_active: true, email_verified: true,
    date_joined: '2025-12-01T00:00:00Z' },
];

const wrap = () => {
  const store = configureStore({
    reducer: { admin: adminReducer },
  });
  return (
    <Provider store={store}>
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>
    </Provider>
  );
};

describe('AdminUsersPage — UC-ADM-01 filtros de rol', () => {
  it('muestra botones de filtro de rol (Todos, Compradores, Administradores)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, () =>
        HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null }),
      ),
    );
    render(wrap());
    expect(await screen.findByRole('button', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compradores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Administradores/i })).toBeInTheDocument();
  });

  it('al hacer clic en Compradores llama a la API con is_admin=false', async () => {
    let lastGetUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, ({ request }) => {
        lastGetUrl = request.url;
        return HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null });
      }),
    );
    render(wrap());
    await screen.findByRole('button', { name: /Todos/i });
    fireEvent.click(screen.getByRole('button', { name: /Compradores/i }));
    await waitFor(() => {
      expect(lastGetUrl).toContain('/api/v2/admin/users/');
      expect(lastGetUrl).toContain('is_admin=false');
    });
  });

  it('al hacer clic en Administradores llama a la API con is_admin=true', async () => {
    let lastGetUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, ({ request }) => {
        lastGetUrl = request.url;
        return HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null });
      }),
    );
    render(wrap());
    await screen.findByRole('button', { name: /Todos/i });
    fireEvent.click(screen.getByRole('button', { name: /Administradores/i }));
    await waitFor(() => {
      expect(lastGetUrl).toContain('/api/v2/admin/users/');
      expect(lastGetUrl).toContain('is_admin=true');
    });
  });

  it('al hacer clic en Staff también llama a la API con is_admin=true', async () => {
    let lastGetUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, ({ request }) => {
        lastGetUrl = request.url;
        return HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null });
      }),
    );
    render(wrap());
    await screen.findByRole('button', { name: /Todos/i });
    fireEvent.click(screen.getByRole('button', { name: /^Staff$/i }));
    await waitFor(() => {
      expect(lastGetUrl).toContain('/api/v2/admin/users/');
      expect(lastGetUrl).toContain('is_admin=true');
    });
  });

  it('muestra botones de filtro de estado (Activos, Sin verificar, Inactivos)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, () =>
        HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null }),
      ),
    );
    render(wrap());
    const activosButtons = await screen.findAllByRole('button', { name: /Activos/i });
    expect(activosButtons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Sin verificar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inactivos/i })).toBeInTheDocument();
  });
});
