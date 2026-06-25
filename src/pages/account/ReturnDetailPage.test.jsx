/**
 * Tests — ReturnDetailPage
 * UC-RET-04: Detalle del estado de la devolucion
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import returnsReducer from '@redux/slices/returnsSlice';
import ReturnDetailPage from './ReturnDetailPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store, initial = '/account/returns/77') => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/account/returns/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const RETURN_OK = {
  id: 77,
  order_id: 'ORD-001',
  status: 'APPROVED',
  reason: 'DAMAGED_PRODUCT',
  description: 'Producto llegó dañado',
  created_at: '2026-05-10T10:00:00Z',
  history: [
    { id: 1, status_to: 'PENDING_REVIEW', created_at: '2026-05-10T10:00:00Z' },
    { id: 2, status_to: 'APPROVED',       created_at: '2026-05-11T10:00:00Z' },
  ],
  refund: { status: 'PENDING_REVIEW', amount: 1250 },
};

describe('ReturnDetailPage (UC-RET-04 detalle)', () => {
  it('carga el detalle por id desde la URL', async () => {
    let requestUrl;
    server.use(
      http.get(`${BASE}/api/v2/return-requests/:id/`, ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(RETURN_OK);
      }),
    );
    render(wrap(<ReturnDetailPage />, makeStore()));

    await screen.findByText(/Devoluci.n #77/);
    expect(requestUrl).toContain('/return-requests/77/');
  });

  it('muestra el estado actual en español', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/:id/`, () =>
        HttpResponse.json(RETURN_OK),
      ),
    );
    render(wrap(<ReturnDetailPage />, makeStore()));
    const matches = await screen.findAllByText(/^Aprobada$/i);
    expect(matches.length).toBeGreaterThan(0);
  });

  it('renderiza el historial de cambios de estado', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/:id/`, () =>
        HttpResponse.json(RETURN_OK),
      ),
    );
    render(wrap(<ReturnDetailPage />, makeStore()));
    await screen.findByText(/Historial/i);
    expect(screen.getByText(/Pendiente de revisión/i)).toBeInTheDocument();
  });

  it('muestra el estado del reembolso si existe', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/:id/`, () =>
        HttpResponse.json(RETURN_OK),
      ),
    );
    render(wrap(<ReturnDetailPage />, makeStore()));
    expect(await screen.findByText(/Reembolso/i)).toBeInTheDocument();
  });

  it('muestra el motivo del rechazo si la solicitud fue rechazada', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/:id/`, () =>
        HttpResponse.json({
          ...RETURN_OK,
          status: 'REJECTED',
          rejection_reason: 'El plazo de devolución venció.',
        }),
      ),
    );
    render(wrap(<ReturnDetailPage />, makeStore()));
    expect(
      await screen.findByText(/El plazo de devolución venció/i)
    ).toBeInTheDocument();
  });

  it('muestra mensaje de error cuando no se encuentra la devolucion', async () => {
    server.use(
      http.get(`${BASE}/api/v2/return-requests/:id/`, () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    );
    render(wrap(<ReturnDetailPage />, makeStore()));
    expect(
      await screen.findByText(/No se encontró la devolución/i)
    ).toBeInTheDocument();
  });
});
