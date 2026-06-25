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
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

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

describe('AdminVouchersPage — listado (UC-PRO-02)', () => {
  it('muestra el título de la página', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: VOUCHERS }),
      ),
    );
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByRole('heading', { name: /Gestión de Cupones/i }))
      .toBeInTheDocument();
  });

  it('renderiza la tabla con los cupones', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: VOUCHERS }),
      ),
    );
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByText('WELCOME10')).toBeInTheDocument();
    expect(screen.getByText('FIXED50')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay cupones', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: [] }),
      ),
    );
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByText(/No se encontraron cupones/i)).toBeInTheDocument();
  });

  it('muestra un boton para crear voucher', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: VOUCHERS }),
      ),
    );
    render(wrap(<AdminVouchersPage />, makeStore()));
    expect(await screen.findByRole('button', { name: /Nuevo cupon/i }))
      .toBeInTheDocument();
  });
});

describe('AdminVouchersPage — desactivar (UC-PRO-03)', () => {
  it('llama al endpoint de desactivar al confirmar', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: VOUCHERS }),
      ),
    );

    let lastPostUrl;
    server.use(
      http.post(`${BASE}/api/v2/admin/vouchers/1/deactivate/`, async ({ request }) => {
        lastPostUrl = request.url;
        return HttpResponse.json({ ...VOUCHERS[0], is_active: false });
      }),
    );

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(wrap(<AdminVouchersPage />, makeStore()));
    await screen.findByText('WELCOME10');

    const btn = screen.getByRole('button', { name: /Desactivar WELCOME10/i });
    fireEvent.click(btn);

    await waitFor(() => expect(lastPostUrl).toContain('/admin/vouchers/1/deactivate/'));

    confirmSpy.mockRestore();
  });

  it('no llama al endpoint si el admin cancela la confirmacion', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: VOUCHERS }),
      ),
    );

    let postCalled = false;
    server.use(
      http.post(`${BASE}/api/v2/admin/vouchers/1/deactivate/`, () => {
        postCalled = true;
        return HttpResponse.json({});
      }),
    );

    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    render(wrap(<AdminVouchersPage />, makeStore()));
    await screen.findByText('WELCOME10');

    fireEvent.click(screen.getByRole('button', { name: /Desactivar WELCOME10/i }));
    expect(postCalled).toBe(false);

    confirmSpy.mockRestore();
  });

  it('no muestra boton de desactivar si el voucher ya esta inactivo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
        HttpResponse.json({ results: VOUCHERS }),
      ),
    );
    render(wrap(<AdminVouchersPage />, makeStore()));
    await screen.findByText('FIXED50');
    expect(screen.queryByRole('button', { name: /Desactivar FIXED50/i }))
      .not.toBeInTheDocument();
  });
});
