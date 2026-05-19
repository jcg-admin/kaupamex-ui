/**
 * Tests — AdminPermissionsPage (UC-ADM-02)
 *
 *   GET /api/v1/admin/permissions/
 *   PUT /api/v1/admin/roles/:role/permissions/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), patch: jest.fn() },
}));

import apiService from '@services/apiService';
import permissionsReducer from '@redux/slices/permissionsSlice';
import AdminPermissionsPage from './AdminPermissionsPage';

const DATA = {
  permissions: ['catalog.manage', 'orders.manage', 'users.manage'],
  roles: [
    { role: 'admin',   permissions: ['catalog.manage', 'orders.manage', 'users.manage'] },
    { role: 'staff',   permissions: ['catalog.manage'] },
  ],
};

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const store = configureStore({ reducer: { permissions: permissionsReducer } });
  return (
    <QueryClientProvider client={client}>
      <Provider store={store}>
        <AdminPermissionsPage />
      </Provider>
    </QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('AdminPermissionsPage (UC-ADM-02)', () => {
  it('renderiza la matriz de roles x permisos', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    render(wrap());
    expect(await screen.findByRole('heading', { name: /Permisos/i })).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('staff')).toBeInTheDocument();
    expect(screen.getByText('catalog.manage')).toBeInTheDocument();
  });

  it('refleja los permisos marcados por rol', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    render(wrap());
    await screen.findByText('admin');
    expect(screen.getByLabelText('catalog.manage para staff')).toBeChecked();
    expect(screen.getByLabelText('orders.manage para staff')).not.toBeChecked();
  });

  it('guarda cambios via PUT /api/v1/admin/roles/:role/permissions/', async () => {
    apiService.get.mockResolvedValue({ data: DATA });
    apiService.put.mockResolvedValue({ data: { ok: true } });
    render(wrap());
    await screen.findByText('admin');
    // Toggle orders.manage en staff
    fireEvent.click(screen.getByLabelText('orders.manage para staff'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar staff/i }));

    await waitFor(() => {
      expect(apiService.put).toHaveBeenCalledWith(
        '/api/v1/admin/roles/staff/permissions/',
        expect.objectContaining({
          permissions: expect.arrayContaining(['catalog.manage', 'orders.manage']),
        }),
      );
    });
  });
});
