/**
 * Tests — AdminReturnDetailPage
 * UC-RET-02: Revisar solicitud (aprobar / rechazar / solicitar info)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import returnsReducer from '@redux/slices/returnsSlice';
import AdminReturnDetailPage from './AdminReturnDetailPage';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store, initial = '/admin/returns/300') => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/admin/returns/:id" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const PENDING_RETURN = {
  id: 300,
  order_id: 'ORD-300',
  status: 'PENDING_REVIEW',
  reason: 'PRODUCTO_DANADO',
  description: 'Producto recibido con un golpe en el empaque',
  created_at: '2026-05-10T10:00:00Z',
  user_email: 'demo@test.mx', user_username: 'Demo Yoruba',
  items: [
    { id: 1, product_name: 'Collar Oshun', quantity: 1, price: 1250 },
  ],
};

describe('AdminReturnDetailPage (UC-RET-02)', () => {
  it('carga el detalle admin por id desde la URL', async () => {
    let calledUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/:id/`, ({ request }) => {
        calledUrl = request.url;
        return HttpResponse.json(PENDING_RETURN);
      }),
    );
    render(wrap(<AdminReturnDetailPage />, makeStore()));

    await screen.findByText(/Devoluci.n #300/);
    expect(calledUrl).toContain('/admin/returns/300/');
  });

  it('muestra los datos del comprador y de la orden', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/:id/`, () => HttpResponse.json(PENDING_RETURN)),
    );
    render(wrap(<AdminReturnDetailPage />, makeStore()));
    expect(await screen.findByText('demo@test.mx')).toBeInTheDocument();
    expect(screen.getByText('ORD-300')).toBeInTheDocument();
    expect(screen.getByText('Collar Oshun')).toBeInTheDocument();
  });

  it('aprueba la solicitud al confirmar el formulario', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/:id/`, () => HttpResponse.json(PENDING_RETURN)),
    );
    let approvedId;
    server.use(
      http.post(`${BASE}/api/v1/admin/returns/:id/approve/`, ({ params }) => {
        approvedId = params.id;
        return HttpResponse.json({ ...PENDING_RETURN, status: 'APPROVED' });
      }),
    );

    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.change(screen.getByLabelText(/Justificaci/i),
      { target: { value: 'Daño confirmado por fotos' } });
    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));

    await waitFor(() => expect(approvedId).toBe('300'));
  });

  it('rechaza la solicitud con justificacion', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/:id/`, () => HttpResponse.json(PENDING_RETURN)),
    );
    let rejectedId;
    server.use(
      http.post(`${BASE}/api/v1/admin/returns/:id/reject/`, ({ params }) => {
        rejectedId = params.id;
        return HttpResponse.json({ ...PENDING_RETURN, status: 'REJECTED' });
      }),
    );

    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.change(screen.getByLabelText(/Justificaci/i),
      { target: { value: 'Plazo de devolución vencido' } });
    fireEvent.click(screen.getByRole('button', { name: /^Rechazar$/i }));

    await waitFor(() => expect(rejectedId).toBe('300'));
  });

  it('solicita información adicional al comprador', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/:id/`, () => HttpResponse.json(PENDING_RETURN)),
    );
    let requestedInfoId;
    server.use(
      http.post(`${BASE}/api/v1/admin/returns/:id/request-info/`, ({ params }) => {
        requestedInfoId = params.id;
        return HttpResponse.json({ ...PENDING_RETURN, status: 'INFO_REQUESTED' });
      }),
    );

    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.change(screen.getByLabelText(/Justificaci/i),
      { target: { value: 'Por favor envía fotos adicionales del daño.' } });
    fireEvent.click(screen.getByRole('button', { name: /Solicitar informaci/i }));

    await waitFor(() => expect(requestedInfoId).toBe('300'));
  });

  it('exige justificacion antes de aprobar o rechazar', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/returns/:id/`, () => HttpResponse.json(PENDING_RETURN)),
    );
    let actionCalled = false;
    server.use(
      http.post(`${BASE}/api/v1/admin/returns/:id/approve/`, () => {
        actionCalled = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<AdminReturnDetailPage />, makeStore()));
    await screen.findByText(/Devoluci.n #300/);

    fireEvent.click(screen.getByRole('button', { name: /^Aprobar$/i }));
    expect(screen.getByText(/La justificación es obligatoria/i)).toBeInTheDocument();
    expect(actionCalled).toBe(false);
  });
});
