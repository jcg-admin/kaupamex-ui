/**
 * Tests adicionales — AdminUsersPage (UC-ADM-01)
 *
 * Solo cubre la nueva accion de cambio de rol:
 *   POST /api/v1/admin/users/:id/role/
 *
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
    is_staff: false, is_active: true, date_joined: '2026-01-10T00:00:00Z' },
  { id: 2, username: 'admin1',     email: 'a1@yoruba.mx',
    is_staff: true,  is_active: true, date_joined: '2025-12-01T00:00:00Z' },
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

describe('AdminUsersPage — UC-ADM-01 cambio de rol', () => {
  it('expone un selector de rol por usuario', async () => {
    apiService.get.mockResolvedValue({
      data: { results: USERS, count: USERS.length, next: null, previous: null },
    });
    render(wrap());
    expect(
      await screen.findByLabelText(/Cambiar rol de comprador1/i),
    ).toBeInTheDocument();
  });

  it('envia POST /api/v1/admin/users/:id/role/ al cambiar el rol', async () => {
    apiService.get.mockResolvedValue({
      data: { results: USERS, count: USERS.length, next: null, previous: null },
    });
    apiService.post.mockResolvedValue({ data: { ok: true } });

    render(wrap());
    const select = await screen.findByLabelText(/Cambiar rol de comprador1/i);
    fireEvent.change(select, { target: { value: 'admin' } });

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/users/1/role/',
        { role: 'admin' },
      );
    });
  });

  it('expone un filtro por rol', async () => {
    apiService.get.mockResolvedValue({
      data: { results: USERS, count: USERS.length, next: null, previous: null },
    });
    render(wrap());
    expect(
      await screen.findByLabelText(/Filtrar por rol/i),
    ).toBeInTheDocument();
  });
});
