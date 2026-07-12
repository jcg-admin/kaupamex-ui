/**
 * Tests unitarios — adminSlice
 * UC-AUTH-11/12/13/14/15
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { configureStore } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';
import adminReducer, {
  fetchAdminUsers, fetchAdminUser,
  suspendUser, reactivateUser, createAdminUser,
  setSearch, setPage, clearCurrentUser, clearActionState,
} from './adminSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { admin: adminReducer } });

// Party/authz (T-201): el usuario admin expone email/is_admin/roles — ya no
// username/is_staff/is_superuser/groups.
const USER = {
  id: 42, email: 'buyer42@test.mx',
  is_active: true, is_admin: false, date_joined: '2026-01-01T00:00:00Z',
  roles: [],
};

// =============================================================================
describe('adminSlice — reducers síncronos', () => {
  it('setSearch actualiza search y resetea página', () => {
    const store = makeStore();
    store.dispatch(setSearch('juan'));
    expect(store.getState().admin.search).toBe('juan');
    expect(store.getState().admin.pagination.page).toBe(1);
  });

  it('setPage actualiza la página', () => {
    const store = makeStore();
    store.dispatch(setPage(3));
    expect(store.getState().admin.pagination.page).toBe(3);
  });

  it('clearCurrentUser limpia currentUser y userError', () => {
    const store = makeStore();
    store.dispatch({ type: 'admin/fetchUser/fulfilled', payload: USER });
    store.dispatch(clearCurrentUser());
    expect(store.getState().admin.currentUser).toBeNull();
    expect(store.getState().admin.userError).toBeNull();
  });

  it('clearActionState limpia actionError y lastAction', () => {
    const store = makeStore();
    store.dispatch({ type: 'admin/suspendUser/fulfilled' });
    store.dispatch(clearActionState());
    expect(store.getState().admin.actionError).toBeNull();
    expect(store.getState().admin.lastAction).toBeNull();
  });
});

// =============================================================================
describe('adminSlice — fetchAdminUsers (UC-AUTH-11)', () => {
  it('pending — isLoading=true, error=null', () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, () =>
        new Promise(() => {}), // never resolves — simulate pending
      ),
    );
    const store = makeStore();
    store.dispatch(fetchAdminUsers());
    expect(store.getState().admin.isLoading).toBe(true);
    expect(store.getState().admin.error).toBeNull();
  });

  it('fulfilled — hidrata users y paginación', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, () =>
        HttpResponse.json({ results: [USER], count: 1, next: null, previous: null }),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUsers());
    const s = store.getState().admin;
    expect(s.isLoading).toBe(false);
    expect(s.users).toHaveLength(1);
    expect(s.users[0].email).toBe('buyer42@test.mx');
    expect(s.pagination.count).toBe(1);
    expect(s.pagination.totalPages).toBe(1);
  });

  it('rejected — isLoading=false, error guardado', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, () =>
        HttpResponse.json({ detail: '403 Forbidden' }, { status: 403 }),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUsers());
    const s = store.getState().admin;
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeDefined();
  });

  it('llama a la URL correcta con params', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/users/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({ results: [], count: 0, next: null, previous: null });
      }),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUsers({ search: 'ana', is_active: 'true' }));
    await waitFor(() => expect(capturedUrl).toBeDefined());
    const url = new URL(capturedUrl);
    expect(url.searchParams.get('search')).toBe('ana');
    expect(url.searchParams.get('is_active')).toBe('true');
  });
});

// =============================================================================
describe('adminSlice — fetchAdminUser (UC-AUTH-12)', () => {
  it('pending — isLoadingUser=true, currentUser=null', () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () =>
        new Promise(() => {}),
      ),
    );
    const store = makeStore();
    store.dispatch(fetchAdminUser(42));
    expect(store.getState().admin.isLoadingUser).toBe(true);
    expect(store.getState().admin.currentUser).toBeNull();
  });

  it('fulfilled — currentUser hidratado', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () =>
        HttpResponse.json(USER),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    expect(store.getState().admin.currentUser).toEqual(USER);
    expect(store.getState().admin.isLoadingUser).toBe(false);
  });

  it('rejected — userError guardado', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/99999/`, () =>
        HttpResponse.json({ detail: '404 Not Found' }, { status: 404 }),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUser(99999));
    expect(store.getState().admin.userError).toBeDefined();
  });

  it('llama a la URL correcta', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(USER);
      }),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    await waitFor(() => expect(capturedUrl).toBeDefined());
    expect(new URL(capturedUrl).pathname).toBe('/api/v2/admin/users/42/');
  });
});

// =============================================================================
describe('adminSlice — suspendUser (UC-AUTH-13)', () => {
  it('fulfilled — lastAction=suspended, is_active=false en currentUser', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () =>
        HttpResponse.json(USER),
      ),
      http.post(`${BASE}/api/v2/admin/users/42/suspend/`, () =>
        HttpResponse.json({ ...USER, is_active: false }),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    await store.dispatch(suspendUser(42));
    const s = store.getState().admin;
    expect(s.lastAction).toBe('suspended');
    expect(s.currentUser.is_active).toBe(false);
    expect(s.isActioning).toBe(false);
  });

  it('rejected — actionError guardado', async () => {
    server.use(
      http.post(`${BASE}/api/v2/admin/users/1/suspend/`, () =>
        HttpResponse.json({ detail: '400 autoprotección' }, { status: 400 }),
      ),
    );
    const store = makeStore();
    await store.dispatch(suspendUser(1));
    expect(store.getState().admin.actionError).toBeDefined();
    expect(store.getState().admin.isActioning).toBe(false);
  });

  it('llama a la URL correcta', async () => {
    let capturedUrl;
    server.use(
      http.post(`${BASE}/api/v2/admin/users/42/suspend/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({});
      }),
    );
    const store = makeStore();
    await store.dispatch(suspendUser(42));
    await waitFor(() => expect(capturedUrl).toBeDefined());
    expect(new URL(capturedUrl).pathname).toBe('/api/v2/admin/users/42/suspend/');
  });
});

// =============================================================================
describe('adminSlice — reactivateUser (UC-AUTH-14)', () => {
  it('fulfilled — lastAction=reactivated, is_active=true en currentUser', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/users/42/`, () =>
        HttpResponse.json({ ...USER, is_active: false }),
      ),
      http.post(`${BASE}/api/v2/admin/users/42/reactivate/`, () =>
        HttpResponse.json({ ...USER, is_active: true }),
      ),
    );
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    await store.dispatch(reactivateUser(42));
    const s = store.getState().admin;
    expect(s.lastAction).toBe('reactivated');
    expect(s.currentUser.is_active).toBe(true);
  });

  it('llama a la URL correcta', async () => {
    let capturedUrl;
    server.use(
      http.post(`${BASE}/api/v2/admin/users/42/reactivate/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({});
      }),
    );
    const store = makeStore();
    await store.dispatch(reactivateUser(42));
    await waitFor(() => expect(capturedUrl).toBeDefined());
    expect(new URL(capturedUrl).pathname).toBe('/api/v2/admin/users/42/reactivate/');
  });
});

// =============================================================================
describe('adminSlice — createAdminUser (UC-AUTH-15, party/authz T-201)', () => {
  it('fulfilled — lastAction=created, nuevo usuario prepend en lista', async () => {
    const newAdmin = { id: 99, email: 'new@test.mx',
                       is_active: true, is_admin: true, roles: [] };
    server.use(
      http.post(`${BASE}/api/v2/admin/users/`, () =>
        HttpResponse.json(newAdmin),
      ),
    );
    const store = makeStore();
    await store.dispatch(createAdminUser({
      email: 'new@test.mx', password: 'Admin123!',
    }));
    const s = store.getState().admin;
    expect(s.lastAction).toBe('created');
    expect(s.users[0].email).toBe('new@test.mx');
    expect(s.pagination.count).toBe(1);
  });

  it('rejected — actionError guardado', async () => {
    server.use(
      http.post(`${BASE}/api/v2/admin/users/`, () =>
        HttpResponse.json({ detail: '400 email en uso' }, { status: 400 }),
      ),
    );
    const store = makeStore();
    await store.dispatch(createAdminUser({ email: 'dup@test.mx', password: 'x' }));
    expect(store.getState().admin.actionError).toBeDefined();
  });

  it('llama a la URL correcta con { email, password } (sin username)', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/admin/users/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 10 });
      }),
    );
    const store = makeStore();
    const payload = { email: 'adm@test.mx', password: 'Adm123!' };
    await store.dispatch(createAdminUser(payload));
    await waitFor(() => expect(lastBody).toBeDefined());
    expect(lastBody).toEqual(payload);
    expect(lastBody).not.toHaveProperty('username');
  });
});
