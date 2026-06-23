/**
 * Tests — AdminReturnsPage
 * UC-RET-05: Ver devoluciones pendientes (Admin)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import returnsReducer from '@redux/slices/returnsSlice';
import AdminReturnsPage from './AdminReturnsPage';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const RETURNS = [
  { id: 200, order_id: 'ORD-A', status: 'PENDING_REVIEW', created_at: '2026-05-01T10:00:00Z',
    user_email: 'demo@test.mx', user_username: 'Demo Yoruba', reason: 'PRODUCTO_DANADO' },
  { id: 201, order_id: 'ORD-B', status: 'APPROVED',           created_at: '2026-05-02T10:00:00Z',
    user_email: 'maria@test.mx', user_username: 'María L.', reason: 'NO_COINCIDE_DESCRIPCION' },
  { id: 202, order_id: 'ORD-C', status: 'INFO_REQUESTED', created_at: '2026-05-03T10:00:00Z',
    user_email: 'juan@test.mx', user_username: 'Juan D.', reason: 'OTRO' },
];

const RESPONSE = {
  results: RETURNS,
  metrics: { pendientes: 1, aprobadas: 1, pendiente_info: 1 },
};

describe('AdminReturnsPage (UC-RET-05)', () => {
  it('muestra el titulo de la bandeja', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Devoluciones pendientes/i })
    ).toBeInTheDocument();
  });

  it('renderiza la tabla con todas las devoluciones', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(await screen.findByText('ORD-A')).toBeInTheDocument();
    expect(screen.getByText('ORD-B')).toBeInTheDocument();
    expect(screen.getByText('ORD-C')).toBeInTheDocument();
  });

  it('muestra el email del comprador en cada fila', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(await screen.findByText('demo@test.mx')).toBeInTheDocument();
    expect(screen.getByText('maria@test.mx')).toBeInTheDocument();
  });

  it('muestra el panel de métricas con los conteos por estado', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReturnsPage />, makeStore()));
    await screen.findByText('ORD-A');
    const metricsPanel = screen.getByLabelText(/Conteo por estado/i);
    expect(metricsPanel).toHaveTextContent(/Pendientes de revisión/i);
    expect(metricsPanel).toHaveTextContent(/Aprobadas/i);
    expect(metricsPanel).toHaveTextContent(/Pendiente de información/i);
  });

  it('filtra el listado por estado al cambiar el selector', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReturnsPage />, makeStore()));
    await screen.findByText('ORD-A');

    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json(RESPONSE);
      }),
    );

    fireEvent.change(screen.getByRole('combobox'),
      { target: { value: 'PENDING_REVIEW' } });

    await waitFor(() => {
      expect(lastUrl).toContain('/admin/returns/');
      expect(lastUrl).toContain('status=PENDING_REVIEW');
    });
  });

  it('muestra estado vacio cuando no hay devoluciones', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () =>
        HttpResponse.json({ results: [], metrics: null }),
      ),
    );
    render(wrap(<AdminReturnsPage />, makeStore()));
    expect(
      await screen.findByText(/No hay devoluciones pendientes/i)
    ).toBeInTheDocument();
  });

  it('cada fila enlaza a su detalle admin', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReturnsPage />, makeStore()));
    const links = await screen.findAllByRole('link', { name: /Ver detalle/i });
    expect(links).toHaveLength(RETURNS.length);
    expect(links[0]).toHaveAttribute('href', '/admin/returns/200');
  });
});
