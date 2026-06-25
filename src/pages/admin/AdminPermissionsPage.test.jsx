/**
 * Tests — AdminPermissionsPage (UC-ADM-02)
 *
 *   GET /api/v2/admin/permissions/
 *   PUT /api/v2/admin/roles/:role/permissions/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

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

describe('AdminPermissionsPage (UC-ADM-02)', () => {
  it('renderiza la matriz de roles x permisos', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/permissions/`, () => HttpResponse.json(DATA)),
    );
    render(wrap());
    expect(await screen.findByRole('heading', { name: /Permisos/i })).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('staff')).toBeInTheDocument();
    expect(screen.getByText('catalog.manage')).toBeInTheDocument();
  });

  it('refleja los permisos marcados por rol', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/permissions/`, () => HttpResponse.json(DATA)),
    );
    render(wrap());
    await screen.findByText('admin');
    expect(screen.getByLabelText('catalog.manage para staff')).toBeChecked();
    expect(screen.getByLabelText('orders.manage para staff')).not.toBeChecked();
  });

  it('guarda cambios via PUT /api/v1/admin/roles/:role/permissions/', async () => {
    let putBody;
    let putUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/permissions/`, () => HttpResponse.json(DATA)),
      http.put(`${BASE}/api/v1/admin/roles/staff/permissions/`, async ({ request }) => {
        putUrl = request.url;
        putBody = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    render(wrap());
    await screen.findByText('admin');
    fireEvent.click(screen.getByLabelText('orders.manage para staff'));
    fireEvent.click(screen.getByRole('button', { name: /Guardar staff/i }));

    await waitFor(() => {
      expect(putUrl).toContain('/api/v1/admin/roles/staff/permissions/');
      expect(putBody?.permissions).toEqual(
        expect.arrayContaining(['catalog.manage', 'orders.manage']),
      );
    });
  });
});
