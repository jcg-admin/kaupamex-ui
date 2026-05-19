/**
 * Tests — AdminVouchersPage
 * UC-PRO-02: Listar / editar vouchers
 * UC-PRO-03: Desactivar voucher
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }    from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import vouchersReducer from '@redux/slices/vouchersSlice';
import AdminVouchersPage from './AdminVouchersPage';

const makeStore = () =>
  configureStore({ reducer: { vouchers: vouchersReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const VOUCHERS = [
  { id: 1, code: 'WELCOME10', type: 'PERCENT', value: 10,
    max_uses: 100, is_active: true,  ends_at: '2026-12-31' },
  { id: 2, code: 'FIXED50',   type: 'FIXED',   value: 50,
    max_uses: null, is_active: false, ends_at: '2026-06-30' },
];

afterEach(() => jest.clearAllMocks());

describe('AdminVouchersPage — listado (UC-PRO-02)', () => {
  it('muestra el título de la página', async () => {
    apiService.get.mockResolvedValue({ data: { results: VOUCHERS } });
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByRole('heading', { name: /Gestión de Cupones/i }))
      .toBeInTheDocument();
  });

  it('renderiza la tabla con los cupones', async () => {
    apiService.get.mockResolvedValue({ data: { results: VOUCHERS } });
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('FIXED50')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay cupones', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByText(/No se encontraron cupones/i)).toBeInTheDocument();
  });

  it('muestra un boton para crear voucher', async () => {
    apiService.get.mockResolvedValue({ data: { results: VOUCHERS } });
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByRole('button', { name: /Nuevo cupon/i }))
      .toBeInTheDocument();
  });
});

describe('AdminVouchersPage — desactivar (UC-PRO-03)', () => {
  it('llama al endpoint de desactivar al confirmar', async () => {
    apiService.get.mockResolvedValue({ data: { results: VOUCHERS } });
    apiService.post.mockResolvedValue({
      data: { ...VOUCHERS[0], is_active: false },
    });

    // Confirmacion automatica
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(<AdminVouchersPage />, makeStore()));
    await screen.findByText('WELCOME10');

    const btn = screen.getByRole('button', { name: /Desactivar WELCOME10/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/vouchers/1/deactivate/'),
      );
    });

    confirmSpy.mockRestore();
  });

  it('no llama al endpoint si el admin cancela la confirmacion', async () => {
    apiService.get.mockResolvedValue({ data: { results: VOUCHERS } });
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(wrap(<AdminVouchersPage />, makeStore()));
    await screen.findByText('WELCOME10');

    fireEvent.click(screen.getByRole('button', { name: /Desactivar WELCOME10/i }));
    expect(apiService.post).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('no muestra boton de desactivar si el voucher ya esta inactivo', async () => {
    apiService.get.mockResolvedValue({ data: { results: VOUCHERS } });
    render(wrap(<AdminVouchersPage />, makeStore()));
    await screen.findByText('FIXED50');
    expect(screen.queryByRole('button', { name: /Desactivar FIXED50/i }))
      .not.toBeInTheDocument();
  });
});
