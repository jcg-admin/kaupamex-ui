/**
 * Tests — AdminUserDetailPage
 * UC-AUTH-12: Ver perfil de usuario
 * UC-AUTH-13: Suspender cuenta
 * UC-AUTH-14: Reactivar cuenta
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }       from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import adminReducer from '@redux/slices/adminSlice';
import authReducer  from '@redux/slices/authSlice';
import AdminUserDetailPage from './AdminUserDetailPage';

const makeStore = () =>
  configureStore({
    reducer: { admin: adminReducer, auth: authReducer },
  });

const wrap = (pk, store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[`/admin/users/${pk}`]}>
      <Routes>
        <Route path="/admin/users/:pk" element={<AdminUserDetailPage />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

const USER_ACTIVE = {
  id: 42, username: 'buyer42', email: 'buyer42@test.mx',
  first_name: 'Juan', last_name: 'García', phone: '',
  is_active: true, is_staff: false, date_joined: '2026-01-15T10:00:00Z',
};

const USER_INACTIVE = { ...USER_ACTIVE, is_active: false };

afterEach(() => jest.clearAllMocks());

// =============================================================================
describe('AdminUserDetailPage — perfil (UC-AUTH-12)', () => {
  beforeEach(() => {
    apiService.get.mockResolvedValue({ data: USER_ACTIVE });
  });

  it('muestra el nombre de usuario', async () => {
    render(wrap(42, makeStore()));
    expect(await screen.findByRole('heading', { name: 'buyer42' })).toBeInTheDocument();
  });

  it('muestra el email del usuario', async () => {
    render(wrap(42, makeStore()));
    expect(await screen.findByText('buyer42@test.mx')).toBeInTheDocument();
  });

  it('muestra el estado activo', async () => {
    render(wrap(42, makeStore()));
    expect(await screen.findByText(/Activo/i)).toBeInTheDocument();
  });

  it('muestra la fecha de registro', async () => {
    render(wrap(42, makeStore()));
    expect(await screen.findByText(/15.*ene.*2026|2026.*01.*15/i)).toBeInTheDocument();
  });

  it('muestra spinner mientras carga', () => {
    apiService.get.mockReturnValue(new Promise(() => {}));
    render(wrap(42, makeStore()));
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it('muestra error 404 si usuario no existe', async () => {
    apiService.get.mockRejectedValue(new Error('404'));
    render(wrap(99999, makeStore()));
    expect(await screen.findByRole('heading', { name: /no encontrado/i })).toBeInTheDocument();
  });

  it('muestra enlace para volver al listado', async () => {
    render(wrap(42, makeStore()));
    await screen.findByText('buyer42@test.mx');
    const links = screen.getAllByRole('link', { name: /Volver/i });
    expect(links.length).toBeGreaterThan(0);
  });
});

// =============================================================================
describe('AdminUserDetailPage — suspender (UC-AUTH-13)', () => {
  it('muestra botón Suspender si el usuario está activo', async () => {
    apiService.get.mockResolvedValue({ data: USER_ACTIVE });
    render(wrap(42, makeStore()));
    expect(await screen.findByRole('button', { name: /Suspender/i })).toBeInTheDocument();
  });

  it('no muestra Suspender si el usuario ya está suspendido', async () => {
    apiService.get.mockResolvedValue({ data: USER_INACTIVE });
    render(wrap(42, makeStore()));
    await screen.findByRole('heading', { name: 'buyer42' });
    expect(screen.queryByRole('button', { name: /Suspender/i })).not.toBeInTheDocument();
  });

  it('pide confirmación antes de suspender', async () => {
    apiService.get.mockResolvedValue({ data: USER_ACTIVE });
    render(wrap(42, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Suspender/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Confirmar/i)).toBeInTheDocument();
  });

  it('ejecuta la suspensión al confirmar', async () => {
    apiService.get.mockResolvedValue({ data: USER_ACTIVE });
    apiService.post.mockResolvedValue({ data: { ...USER_ACTIVE, is_active: false } });
    render(wrap(42, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Suspender/i }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    await waitFor(() =>
      expect(apiService.post).toHaveBeenCalledWith('/api/v1/admin/users/42/suspend/')
    );
  });

  it('actualiza el estado a Suspendido tras confirmar', async () => {
    apiService.get.mockResolvedValue({ data: USER_ACTIVE });
    apiService.post.mockResolvedValue({ data: {} });
    render(wrap(42, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Suspender/i }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    expect(await screen.findByText(/Suspendido/i)).toBeInTheDocument();
  });

  it('cancela la suspensión al pulsar Cancelar', async () => {
    apiService.get.mockResolvedValue({ data: USER_ACTIVE });
    render(wrap(42, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Suspender/i }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(apiService.post).not.toHaveBeenCalled();
  });
});

// =============================================================================
describe('AdminUserDetailPage — reactivar (UC-AUTH-14)', () => {
  it('muestra botón Reactivar si el usuario está suspendido', async () => {
    apiService.get.mockResolvedValue({ data: USER_INACTIVE });
    render(wrap(42, makeStore()));
    expect(await screen.findByRole('button', { name: /Reactivar/i })).toBeInTheDocument();
  });

  it('no muestra Reactivar si el usuario está activo', async () => {
    apiService.get.mockResolvedValue({ data: USER_ACTIVE });
    render(wrap(42, makeStore()));
    await screen.findByRole('heading', { name: 'buyer42' });
    expect(screen.queryByRole('button', { name: /Reactivar/i })).not.toBeInTheDocument();
  });

  it('ejecuta la reactivación', async () => {
    apiService.get.mockResolvedValue({ data: USER_INACTIVE });
    apiService.post.mockResolvedValue({ data: { ...USER_INACTIVE, is_active: true } });
    render(wrap(42, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Reactivar/i }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    await waitFor(() =>
      expect(apiService.post).toHaveBeenCalledWith('/api/v1/admin/users/42/reactivate/')
    );
  });

  it('actualiza el estado a Activo tras reactivar', async () => {
    apiService.get.mockResolvedValue({ data: USER_INACTIVE });
    apiService.post.mockResolvedValue({ data: {} });
    render(wrap(42, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Reactivar/i }));
    await screen.findByRole('dialog');
    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }));
    expect(await screen.findByText(/Activo/i)).toBeInTheDocument();
  });
});
