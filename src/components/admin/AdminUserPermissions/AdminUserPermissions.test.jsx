/**
 * Tests — AdminUserPermissions (UC-ADM-02)
 *
 * Cubre el panel de edición de permisos: is_staff / is_superuser / groups,
 * el POST al endpoint, y el manejo de errores con clave `codigo_error`
 * (en particular CANNOT_DEMOTE_SELF) y 403.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import { createErrorFromResponse } from '@utils/apiErrors';
import adminReducer from '@redux/slices/adminSlice';
import authReducer  from '@redux/slices/authSlice';
import AdminUserPermissions from './index';

const BASE = process.env.API_URL || 'http://localhost:8000';

const TARGET_USER = {
  id: 42, username: 'buyer42', email: 'buyer42@test.mx',
  first_name: 'Juan', last_name: 'García',
  is_active: true, is_staff: false, is_admin: false,
};

const SUPERADMIN = { id: 1, username: 'root', is_admin: true, is_staff: true };
const STAFF_ONLY  = { id: 2, username: 'staff', is_admin: false, is_staff: true };

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

describe('AdminUserPermissions — render (UC-ADM-02)', () => {
  it('muestra el control de acceso de staff', () => {
    render(wrap());
    expect(screen.getByText(/Acceso de staff/i)).toBeInTheDocument();
  });

  it('muestra el control de superusuario cuando el viewer es superadmin', () => {
    render(wrap(TARGET_USER, makeStore(SUPERADMIN)));
    expect(screen.getByText(/Superusuario/i)).toBeInTheDocument();
  });

  it('oculta el control de superusuario si el viewer no es superadmin', () => {
    render(wrap(TARGET_USER, makeStore(STAFF_ONLY)));
    expect(screen.queryByText(/Superusuario/i)).not.toBeInTheDocument();
  });

  it('muestra el campo de grupos', () => {
    render(wrap());
    expect(screen.getByPlaceholderText(/1, 2, 3/)).toBeInTheDocument();
  });
});

describe('AdminUserPermissions — guardar (éxito)', () => {
  it('hace POST al endpoint de permisos con el body parcial correcto', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/users/42/permissions/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ ...TARGET_USER, is_staff: true });
      }),
    );
    render(wrap());

    // Activar staff y escribir grupos.
    fireEvent.click(screen.getByRole('checkbox', { name: /Acceso de staff/i }));
    fireEvent.change(screen.getByPlaceholderText(/1, 2, 3/), {
      target: { value: '1, 2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar permisos/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        is_staff: true,
        is_superuser: false,
        groups: [1, 2],
      });
    });
    expect(await screen.findByText(/Permisos actualizados/i)).toBeInTheDocument();
  });

  it('descarta ids de grupo no numéricos', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/users/42/permissions/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(TARGET_USER);
      }),
    );
    render(wrap());
    fireEvent.change(screen.getByPlaceholderText(/1, 2, 3/), {
      target: { value: '3, abc, 5' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar permisos/i }));
    await waitFor(() => {
      expect(lastBody).toMatchObject({ groups: [3, 5] });
    });
  });

  it('un viewer no-superadmin no envía is_superuser', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/admin/users/42/permissions/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json(TARGET_USER);
      }),
    );
    render(wrap(TARGET_USER, makeStore(STAFF_ONLY)));
    fireEvent.click(screen.getByRole('button', { name: /Guardar permisos/i }));
    await waitFor(() => {
      expect(lastBody).not.toHaveProperty('is_superuser');
    });
  });
});

describe('AdminUserPermissions — errores', () => {
  it('muestra mensaje de auto-lockout ante codigo_error CANNOT_DEMOTE_SELF', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/users/1/permissions/`, () =>
        HttpResponse.json(
          {
            detail: 'Un administrador no puede quitarse a sí mismo el rol.',
            codigo_error: 'CANNOT_DEMOTE_SELF',
          },
          { status: 400 },
        ),
      ),
    );
    const selfUser = { ...TARGET_USER, id: 1, username: 'root', is_staff: true, is_admin: true };
    render(wrap(selfUser, makeStore(SUPERADMIN)));

    fireEvent.click(screen.getByRole('button', { name: /Guardar permisos/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/no puedes quitarte a ti mismo/i);
  });

  it('muestra mensaje de permiso denegado ante 403', async () => {
    server.use(
      http.post(`${BASE}/api/v1/admin/users/42/permissions/`, () =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
      ),
    );
    render(wrap());
    fireEvent.click(screen.getByRole('button', { name: /Guardar permisos/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no tienes permiso/i);
  });

  it('muestra nota de advertencia al editar la propia cuenta', () => {
    const selfUser = { ...TARGET_USER, id: 1, username: 'root', is_staff: true, is_admin: true };
    render(wrap(selfUser, makeStore(SUPERADMIN)));
    expect(screen.getByRole('note')).toHaveTextContent(/tu propia cuenta/i);
  });
});
