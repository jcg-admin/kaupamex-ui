/**
 * Tests adicionales — AdminUsersPage (UC-ADM-01)
 *
 * Cubre filtros de rol y estado del listado de usuarios.
 * El listado base lo cubre AdminUsersPage.test.jsx.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import adminReducer      from '@redux/slices/adminSlice';
import adminUsersReducer from '@redux/slices/adminUsersSlice';
import AdminUsersPage    from './AdminUsersPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const USERS = [
  { id: 1, username: 'comprador1', email: 'c1@yoruba.mx',
    first_name: 'Carlos', last_name: 'Uno',
    is_staff: false, is_active: true, email_verified: true,
    date_joined: '2026-01-10T00:00:00Z' },
  { id: 2, username: 'admin1', email: 'a1@yoruba.mx',
    first_name: 'Admin', last_name: 'Uno',
    is_staff: true, is_active: true, email_verified: true,
    date_joined: '2025-12-01T00:00:00Z' },
];

const wrap = () => {
  const store = configureStore({
    reducer: { admin: adminReducer, adminUsers: adminUsersReducer },
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
      http.get(`${BASE}/api/v1/admin/users/`, () =>
        HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null }),
      ),
    );
    render(wrap());
    expect(await screen.findByRole('button', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compradores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Administradores/i })).toBeInTheDocument();
  });

  it('al hacer clic en Compradores llama a la API con is_staff=false', async () => {
    let lastGetUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, ({ request }) => {
        lastGetUrl = request.url;
        return HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null });
      }),
    );
    render(wrap());
    await screen.findByRole('button', { name: /Todos/i });
    fireEvent.click(screen.getByRole('button', { name: /Compradores/i }));
    await waitFor(() => {
      expect(lastGetUrl).toContain('/api/v1/admin/users/');
      expect(lastGetUrl).toContain('is_staff=false');
    });
  });

  it('al hacer clic en Administradores llama a la API con is_staff=true', async () => {
    let lastGetUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, ({ request }) => {
        lastGetUrl = request.url;
        return HttpResponse.json({ results: USERS, count: USERS.length, next: null, previous: null });
      }),
    );
    render(wrap());
    await screen.findByRole('button', { name: /Todos/i });
    fireEvent.click(screen.getByRole('button', { name: /Administradores/i }));
    await waitFor(() => {
      expect(lastGetUrl).toContain('/api/v1/admin/users/');
      expect(lastGetUrl).toContain('is_staff=true');
    });
  });

  it('muestra botones de filtro de estado (Activos, Sin verificar, Inactivos)', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/users/`, () =>
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
