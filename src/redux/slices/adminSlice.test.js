/**
 * Tests unitarios — adminSlice
 * UC-AUTH-11/12/13/14/15
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import adminReducer, {
  fetchAdminUsers, fetchAdminUser,
  suspendUser, reactivateUser, createAdminUser,
  setSearch, setPage, clearCurrentUser, clearActionState,
} from './adminSlice';

const makeStore = () =>
  configureStore({ reducer: { admin: adminReducer } });

const USER = {
  id: 42, username: 'buyer42', email: 'buyer42@test.mx',
  is_active: true, is_staff: false, date_joined: '2026-01-01T00:00:00Z',
};

afterEach(() => jest.clearAllMocks());

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
    const store = makeStore();
    apiService.get.mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchAdminUsers());
    expect(store.getState().admin.isLoading).toBe(true);
    expect(store.getState().admin.error).toBeNull();
  });

  it('fulfilled — hidrata users y paginación', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [USER], count: 1, next: null, previous: null },
    });
    const store = makeStore();
    await store.dispatch(fetchAdminUsers());
    const s = store.getState().admin;
    expect(s.isLoading).toBe(false);
    expect(s.users).toHaveLength(1);
    expect(s.users[0].username).toBe('buyer42');
    expect(s.pagination.count).toBe(1);
    expect(s.pagination.totalPages).toBe(1);
  });

  it('rejected — isLoading=false, error guardado', async () => {
    apiService.get.mockRejectedValue(new Error('403 Forbidden'));
    const store = makeStore();
    await store.dispatch(fetchAdminUsers());
    const s = store.getState().admin;
    expect(s.isLoading).toBe(false);
    expect(s.error).toBeDefined();
  });

  it('llama a la URL correcta con params', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [], count: 0, next: null, previous: null },
    });
    const store = makeStore();
    await store.dispatch(fetchAdminUsers({ search: 'ana', is_active: 'true' }));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/users/',
      { params: { search: 'ana', is_active: 'true' } }
    );
  });
});

// =============================================================================
describe('adminSlice — fetchAdminUser (UC-AUTH-12)', () => {
  it('pending — isLoadingUser=true, currentUser=null', () => {
    const store = makeStore();
    apiService.get.mockReturnValue(new Promise(() => {}));
    store.dispatch(fetchAdminUser(42));
    expect(store.getState().admin.isLoadingUser).toBe(true);
    expect(store.getState().admin.currentUser).toBeNull();
  });

  it('fulfilled — currentUser hidratado', async () => {
    apiService.get.mockResolvedValue({ data: USER });
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    expect(store.getState().admin.currentUser).toEqual(USER);
    expect(store.getState().admin.isLoadingUser).toBe(false);
  });

  it('rejected — userError guardado', async () => {
    apiService.get.mockRejectedValue(new Error('404 Not Found'));
    const store = makeStore();
    await store.dispatch(fetchAdminUser(99999));
    expect(store.getState().admin.userError).toBeDefined();
  });

  it('llama a la URL correcta', async () => {
    apiService.get.mockResolvedValue({ data: USER });
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    expect(apiService.get).toHaveBeenCalledWith('/api/v1/admin/users/42/');
  });
});

// =============================================================================
describe('adminSlice — suspendUser (UC-AUTH-13)', () => {
  it('fulfilled — lastAction=suspended, is_active=false en currentUser', async () => {
    apiService.get.mockResolvedValue({ data: USER });
    apiService.post.mockResolvedValue({ data: { ...USER, is_active: false } });
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    await store.dispatch(suspendUser(42));
    const s = store.getState().admin;
    expect(s.lastAction).toBe('suspended');
    expect(s.currentUser.is_active).toBe(false);
    expect(s.isActioning).toBe(false);
  });

  it('rejected — actionError guardado', async () => {
    apiService.post.mockRejectedValue(new Error('400 autoprotección'));
    const store = makeStore();
    await store.dispatch(suspendUser(1));
    expect(store.getState().admin.actionError).toBeDefined();
    expect(store.getState().admin.isActioning).toBe(false);
  });

  it('llama a la URL correcta', async () => {
    apiService.post.mockResolvedValue({ data: {} });
    const store = makeStore();
    await store.dispatch(suspendUser(42));
    expect(apiService.post).toHaveBeenCalledWith('/api/v1/admin/users/42/suspend/');
  });
});

// =============================================================================
describe('adminSlice — reactivateUser (UC-AUTH-14)', () => {
  it('fulfilled — lastAction=reactivated, is_active=true en currentUser', async () => {
    apiService.get.mockResolvedValue({ data: { ...USER, is_active: false } });
    apiService.post.mockResolvedValue({ data: { ...USER, is_active: true } });
    const store = makeStore();
    await store.dispatch(fetchAdminUser(42));
    await store.dispatch(reactivateUser(42));
    const s = store.getState().admin;
    expect(s.lastAction).toBe('reactivated');
    expect(s.currentUser.is_active).toBe(true);
  });

  it('llama a la URL correcta', async () => {
    apiService.post.mockResolvedValue({ data: {} });
    const store = makeStore();
    await store.dispatch(reactivateUser(42));
    expect(apiService.post).toHaveBeenCalledWith('/api/v1/admin/users/42/reactivate/');
  });
});

// =============================================================================
describe('adminSlice — createAdminUser (UC-AUTH-15)', () => {
  it('fulfilled — lastAction=created, nuevo usuario prepend en lista', async () => {
    const newAdmin = { id: 99, username: 'newadmin', email: 'new@test.mx',
                       is_active: true, is_staff: true };
    apiService.post.mockResolvedValue({ data: newAdmin });
    const store = makeStore();
    await store.dispatch(createAdminUser({
      username: 'newadmin', email: 'new@test.mx', password: 'Admin123!',
    }));
    const s = store.getState().admin;
    expect(s.lastAction).toBe('created');
    expect(s.users[0].username).toBe('newadmin');
    expect(s.pagination.count).toBe(1);
  });

  it('rejected — actionError guardado', async () => {
    apiService.post.mockRejectedValue(new Error('400 username en uso'));
    const store = makeStore();
    await store.dispatch(createAdminUser({ username: 'dup', email: 'dup@test.mx', password: 'x' }));
    expect(store.getState().admin.actionError).toBeDefined();
  });

  it('llama a la URL correcta con los datos del usuario', async () => {
    apiService.post.mockResolvedValue({ data: { id: 10 } });
    const store = makeStore();
    const payload = { username: 'adm', email: 'adm@test.mx', password: 'Adm123!' };
    await store.dispatch(createAdminUser(payload));
    expect(apiService.post).toHaveBeenCalledWith('/api/v1/admin/users/', payload);
  });
});
