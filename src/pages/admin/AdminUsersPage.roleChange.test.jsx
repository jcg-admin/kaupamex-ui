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

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import adminReducer      from '@redux/slices/adminSlice';
import adminUsersReducer from '@redux/slices/adminUsersSlice';
import AdminUsersPage    from './AdminUsersPage';

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

afterEach(() => jest.clearAllMocks());

describe('AdminUsersPage — UC-ADM-01 filtros de rol', () => {
  it('muestra botones de filtro de rol (Todos, Compradores, Administradores)', async () => {
    apiService.get.mockResolvedValue({
      data: { results: USERS, count: USERS.length, next: null, previous: null },
    });
    render(wrap());
    expect(await screen.findByRole('button', { name: /Todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Compradores/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Administradores/i })).toBeInTheDocument();
  });

  it('al hacer clic en Compradores llama a la API con is_staff=false', async () => {
    apiService.get.mockResolvedValue({
      data: { results: USERS, count: USERS.length, next: null, previous: null },
    });
    render(wrap());
    await screen.findByRole('button', { name: /Todos/i });
    fireEvent.click(screen.getByRole('button', { name: /Compradores/i }));
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v1/admin/users/',
        expect.objectContaining({
          params: expect.objectContaining({ is_staff: 'false' }),
        }),
      );
    });
  });

  it('al hacer clic en Administradores llama a la API con is_staff=true', async () => {
    apiService.get.mockResolvedValue({
      data: { results: USERS, count: USERS.length, next: null, previous: null },
    });
    render(wrap());
    await screen.findByRole('button', { name: /Todos/i });
    fireEvent.click(screen.getByRole('button', { name: /Administradores/i }));
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v1/admin/users/',
        expect.objectContaining({
          params: expect.objectContaining({ is_staff: 'true' }),
        }),
      );
    });
  });

  it('muestra botones de filtro de estado (Activos, Sin verificar, Inactivos)', async () => {
    apiService.get.mockResolvedValue({
      data: { results: USERS, count: USERS.length, next: null, previous: null },
    });
    render(wrap());
    const activosButtons = await screen.findAllByRole('button', { name: /Activos/i });
    expect(activosButtons.length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Sin verificar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Inactivos/i })).toBeInTheDocument();
  });
});
