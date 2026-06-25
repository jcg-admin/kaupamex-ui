/**
 * Tests — ReturnsPage
 * UC-RET-04: Listar devoluciones del comprador
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import returnsReducer from '@redux/slices/returnsSlice';
import ReturnsPage from './ReturnsPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

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
  { id: 10, order_id: 'ORD-001', status: 'PENDING_REVIEW', created_at: '2026-05-10T10:00:00Z' },
  { id: 11, order_id: 'ORD-002', status: 'APPROVED',           created_at: '2026-05-09T10:00:00Z' },
  { id: 12, order_id: 'ORD-003', status: 'RECEIVED',         created_at: '2026-05-01T10:00:00Z' },
  { id: 13, order_id: 'ORD-004', status: 'REJECTED',          created_at: '2026-04-25T10:00:00Z' },
];

describe('ReturnsPage (UC-RET-04 listado)', () => {
  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/`, () =>
        HttpResponse.json({ results: RETURNS }),
      ),
    );
    render(wrap(<ReturnsPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Mis devoluciones/i })
    ).toBeInTheDocument();
  });

  it('renderiza las devoluciones del comprador', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/`, () =>
        HttpResponse.json({ results: RETURNS }),
      ),
    );
    render(wrap(<ReturnsPage />, makeStore()));
    expect(await screen.findByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();
    expect(screen.getByText('ORD-003')).toBeInTheDocument();
  });

  it('muestra los estados en español', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/`, () =>
        HttpResponse.json({ results: RETURNS }),
      ),
    );
    render(wrap(<ReturnsPage />, makeStore()));
    expect(await screen.findByText(/Pendiente de revisión/i)).toBeInTheDocument();
    expect(screen.getByText(/^Aprobada$/i)).toBeInTheDocument();
    // RECEIVED -> Recibida (canon EN, DEC-RET-02). Antes el test esperaba
    // "Completada" — vocabulario cuatripartito UC-RET-03 D-01 resuelto.
    expect(screen.getByText(/^Recibida$/i)).toBeInTheDocument();
    expect(screen.getByText(/Rechazada/i)).toBeInTheDocument();
  });

  it('muestra estado vacio cuando no hay devoluciones', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/`, () =>
        HttpResponse.json({ results: [] }),
      ),
    );
    render(wrap(<ReturnsPage />, makeStore()));
    expect(
      await screen.findByText(/No tienes devoluciones/i)
    ).toBeInTheDocument();
  });

  it('muestra enlace para crear una nueva devolucion', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/`, () =>
        HttpResponse.json({ results: RETURNS }),
      ),
    );
    render(wrap(<ReturnsPage />, makeStore()));
    const link = await screen.findByRole('link', { name: /Solicitar devoluci/i });
    expect(link).toHaveAttribute('href', '/account/returns/new');
  });
});
