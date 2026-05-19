/**
 * Tests — AdminUsersPage
 * UC-AUTH-11: Listado de usuarios
 * UC-AUTH-15: Crear usuario administrador
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }    from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import adminReducer from '@redux/slices/adminSlice';
import authReducer  from '@redux/slices/authSlice';
import AdminUsersPage from './AdminUsersPage';

const makeStore = () =>
  configureStore({
    reducer: { admin: adminReducer, auth: authReducer },
  });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

const USERS = [
  { id: 1, username: 'buyer1', email: 'buyer1@test.mx',
    is_active: true, is_staff: false, date_joined: '2026-01-01T00:00:00Z' },
  { id: 2, username: 'buyer2', email: 'buyer2@test.mx',
    is_active: false, is_staff: false, date_joined: '2026-01-02T00:00:00Z' },
];

const pageOf = (results = []) => ({
  data: { results, count: results.length, next: null, previous: null },
});

afterEach(() => jest.clearAllMocks());

// =============================================================================
describe('AdminUsersPage — listado (UC-AUTH-11)', () => {
  it('muestra el título de la página', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByRole('heading', { name: /Gestión de Usuarios/i }))
      .toBeInTheDocument();
  });

  it('muestra el campo de búsqueda', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
  });

  it('renderiza la tabla con los usuarios', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText('buyer1')).toBeInTheDocument();
    expect(await screen.findByText('buyer2')).toBeInTheDocument();
  });

  it('muestra email de cada usuario', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText('buyer1@test.mx')).toBeInTheDocument();
  });

  it('indica el estado activo/inactivo del usuario', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText('Activo')).toBeInTheDocument();
    expect(await screen.findByText('Suspendido')).toBeInTheDocument();
  });

  it('muestra spinner durante la carga', () => {
    apiService.get.mockReturnValue(new Promise(() => {}));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument();
  });

  it('muestra alerta de error si el API falla', async () => {
    apiService.get.mockRejectedValue(new Error('403'));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('muestra mensaje si no hay usuarios', async () => {
    apiService.get.mockResolvedValue(pageOf([]));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByText(/No se encontraron usuarios/i)).toBeInTheDocument();
  });

  it('cada fila tiene un enlace al detalle del usuario', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    await screen.findByText('buyer1');
    const links = screen.getAllByRole('link', { name: /Ver/i });
    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/admin/users/'));
  });
});

// =============================================================================
describe('AdminUsersPage — búsqueda', () => {
  it('filtra usuarios al buscar', async () => {
    apiService.get
      .mockResolvedValueOnce(pageOf(USERS))
      .mockResolvedValueOnce(pageOf([USERS[0]]));
    render(wrap(<AdminUsersPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'buyer1' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    await waitFor(() =>
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v1/admin/users/',
        expect.objectContaining({ params: expect.objectContaining({ search: 'buyer1' }) })
      )
    );
  });
});

// =============================================================================
describe('AdminUsersPage — crear admin (UC-AUTH-15)', () => {
  it('muestra el botón para crear nuevo administrador', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    expect(await screen.findByRole('button', { name: /Nuevo Administrador/i }))
      .toBeInTheDocument();
  });

  it('abre el formulario al pulsar el botón de nuevo admin', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Nuevo Administrador/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('el formulario tiene los campos requeridos', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    render(wrap(<AdminUsersPage />, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Nuevo Administrador/i }));
    await screen.findByRole('dialog');
    expect(document.querySelector('#new-username')).toBeInTheDocument();
    expect(document.querySelector('#new-email')).toBeInTheDocument();
    expect(document.querySelector('#new-password')).toBeInTheDocument();
  });

  it('crea el admin y cierra el modal al confirmar', async () => {
    apiService.get.mockResolvedValue(pageOf(USERS));
    apiService.post.mockResolvedValue({
      data: { id: 99, username: 'newadmin', email: 'new@test.mx',
              is_active: true, is_staff: true, date_joined: '2026-05-05T00:00:00Z' },
    });
    render(wrap(<AdminUsersPage />, makeStore()));
    fireEvent.click(await screen.findByRole('button', { name: /Nuevo Administrador/i }));
    await screen.findByRole('dialog');
    fireEvent.change(document.querySelector('#new-username'), { target: { value: 'newadmin' } });
    fireEvent.change(document.querySelector('#new-email'),    { target: { value: 'new@test.mx' } });
    fireEvent.change(document.querySelector('#new-password'), { target: { value: 'Admin123!' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear/i }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(apiService.post).toHaveBeenCalledWith('/api/v1/admin/users/', {
      username: 'newadmin', email: 'new@test.mx', password: 'Admin123!',
    });
  });
});
