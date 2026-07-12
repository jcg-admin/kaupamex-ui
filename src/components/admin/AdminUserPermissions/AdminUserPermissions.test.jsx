/**
 * Tests — AdminUserPermissions (UC-ADM-02, party/authz T-201)
 *
 * Cubre el panel de edición de **roles authz** de un usuario: el input de
 * ids de rol (separados por coma) inicializado desde `user.roles`, el POST
 * `{ roles: [ids] }` al endpoint de permisos, y el manejo de errores con
 * clave `codigo_error` (en particular CANNOT_DEMOTE_SELF) y 403.
 *
 * Los checkboxes is_staff/is_superuser y el input de groups ya no existen —
 * el acceso admin es la titularidad del rol `superadmin` vía RoleAssignment.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import adminReducer from '@redux/slices/adminSlice';
import authReducer  from '@redux/slices/authSlice';
import AdminUserPermissions from './index';

const BASE = process.env.API_URL || 'http://localhost:8000';

const TARGET_USER = {
  id: 42, email: 'buyer42@test.mx',
  first_name: 'Juan', last_name: 'García',
  is_active: true, is_admin: false,
  roles: [{ id: 3, code: 'catalog_editor', name: 'Editor de catálogo' }],
};

const SUPERADMIN = { id: 1, email: 'root@test.mx', is_admin: true };
const STAFF_ONLY  = { id: 2, email: 'staff@test.mx', is_admin: false };

const makeStore = (authUser = SUPERADMIN) =>
  configureStore({
    reducer: { admin: adminReducer, auth: authReducer },
    preloadedState: {
      auth: { user: authUser, isAuthenticated: true, isLoading: false, error: null },
    },
  });

const wrap = (user = TARGET_USER, store = makeStore()) => (
  <Provider store={store}>
    <AdminUserPermissions user={user} />
  </Provider>
);

describe('AdminUserPermissions — render (UC-ADM-02, party/authz)', () => {
  it('muestra el encabezado "Roles"', () => {
    render(wrap());
    expect(screen.getByRole('heading', { name: 'Roles' })).toBeInTheDocument();
  });

  it('muestra el email del usuario en el subtítulo', () => {
    render(wrap());
    expect(screen.getByText(/buyer42@test\.mx/)).toBeInTheDocument();
  });

  it('inicializa el input con los ids de rol actuales del usuario', () => {
    render(wrap());
    expect(screen.getByPlaceholderText(/1, 2, 3/)).toHaveValue('3');
  });

  it('inicializa el input vacío cuando el usuario no tiene roles', () => {
    render(wrap({ ...TARGET_USER, roles: [] }));
    expect(screen.getByPlaceholderText(/1, 2, 3/)).toHaveValue('');
  });
});

describe('AdminUserPermissions — guardar (éxito)', () => {
  it('hace POST al endpoint de permisos con { roles: [ids] }', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/admin/users/42/permissions/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({
          ...TARGET_USER,
          roles: [{ id: 1, code: 'r1', name: 'R1' }, { id: 2, code: 'r2', name: 'R2' }],
        });
      }),
    );
    render(wrap());

    fireEvent.change(screen.getByPlaceholderText(/1, 2, 3/), {
      target: { value: '1, 2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar roles/i }));

    await waitFor(() => {
      expect(lastBody).toEqual({ roles: [1, 2] });
    });
    expect(await screen.findByText('Roles actualizados.')).toBeInTheDocument();
  });

  it('descarta ids de rol no numéricos', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/admin/users/42/permissions/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(TARGET_USER);
      }),
    );
    render(wrap());
    fireEvent.change(screen.getByPlaceholderText(/1, 2, 3/), {
      target: { value: '3, abc, 5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar roles/i }));
    await waitFor(() => {
      expect(lastBody).toEqual({ roles: [3, 5] });
    });
  });

  it('muestra "Guardando…" y deshabilita el botón mientras la acción está en curso', async () => {
    server.use(
      http.post(`${BASE}/api/v2/admin/users/42/permissions/`, () => new Promise(() => {})),
    );
    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: /Guardar roles/i }));
    expect(await screen.findByRole('button', { name: /Guardando…/i })).toBeDisabled();
  });
});

describe('AdminUserPermissions — errores', () => {
  it('muestra mensaje de auto-lockout ante codigo_error CANNOT_DEMOTE_SELF', async () => {
    server.use(
      http.post(`${BASE}/api/v2/admin/users/1/permissions/`, () =>
        HttpResponse.json(
          {
            detail: 'Un administrador no puede quitarse a sí mismo el rol.',
            codigo_error: 'CANNOT_DEMOTE_SELF',
          },
          { status: 400 },
        ),
      ),
    );
    const selfUser = {
      ...TARGET_USER, id: 1, email: 'root@test.mx', is_admin: true,
      roles: [{ id: 1, code: 'superadmin', name: 'Superadmin' }],
    };
    render(wrap(selfUser, makeStore(SUPERADMIN)));

    fireEvent.click(screen.getByRole('button', { name: /Guardar roles/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /no puedes quitarte a ti mismo el rol de superadministrador/i,
    );
  });

  it('muestra mensaje de permiso denegado ante 403', async () => {
    server.use(
      http.post(`${BASE}/api/v2/admin/users/42/permissions/`, () =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
      ),
    );
    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: /Guardar roles/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no tienes permiso/i);
  });

  it('muestra nota de advertencia al editar la propia cuenta', () => {
    const selfUser = { ...TARGET_USER, id: 1, email: 'root@test.mx', is_admin: true };
    render(wrap(selfUser, makeStore(SUPERADMIN)));
    expect(screen.getByRole('note')).toHaveTextContent(/tu propia cuenta/i);
  });

  it('no muestra la nota de advertencia si el viewer edita a otro usuario', () => {
    render(wrap(TARGET_USER, makeStore(STAFF_ONLY)));
    expect(screen.queryByRole('note')).not.toBeInTheDocument();
  });
});
