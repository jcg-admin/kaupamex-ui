/**
 * Tests — AdminPaymentRefundPage
 * UC-PAY-09: El admin procesa manualmente un reembolso sobre un Payment APPROVED.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import paymentsReducer from '@redux/slices/paymentsSlice';
import AdminPaymentRefundPage from './AdminPaymentRefundPage';

const makeStore = () => configureStore({ reducer: { payments: paymentsReducer } });
const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store, path = '/admin/payments/501/refund') => (
  <Provider store={store}>
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/admin/payments/:paymentId/refund" element={ui} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const APPROVED_PAYMENT = {
  id: 501,
  status: 'APPROVED',
  gateway: 'mercadopago',
  amount: 1500,
  currency: 'MXN',
  order_number: 'ORD-88',
};

describe('AdminPaymentRefundPage (UC-PAY-09)', () => {
  it('muestra el titulo y la informacion del pago', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Procesar reembolso/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/ORD-88/)).toBeInTheDocument();
  });

  it('envia el reembolso con monto y motivo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
    );
    let lastRefundBody;
    server.use(
      http.post(`${BASE}/api/v2/payments/admin/:paymentId/refund/`, async ({ request }) => {
        lastRefundBody = await request.json();
        return HttpResponse.json({ id: 'rfd-1', amount: 500, status: 'REFUNDED' });
      }),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), {
      target: { value: 'Reembolso de cortesia por incidente' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    await waitFor(() => {
      expect(lastRefundBody).toMatchObject({ amount: 500, reason: 'Reembolso de cortesia por incidente' });
    });
  });

  it('rechaza el envio si el motivo esta vacio', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
    );
    let refundCalled = false;
    server.use(
      http.post(`${BASE}/api/v2/payments/admin/:paymentId/refund/`, () => {
        refundCalled = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(refundCalled).toBe(false);
    expect(screen.getByText(/Motivo es obligatorio/i)).toBeInTheDocument();
  });

  it('rechaza monto mayor al pago', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
    );
    let refundCalled = false;
    server.use(
      http.post(`${BASE}/api/v2/payments/admin/:paymentId/refund/`, () => {
        refundCalled = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'Test refund completo' } });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(refundCalled).toBe(false);
    expect(screen.getByText(/no puede superar el monto del pago/i)).toBeInTheDocument();
  });

  it('muestra confirmacion tras un reembolso exitoso', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
    );
    server.use(
      http.post(`${BASE}/api/v2/payments/admin/:paymentId/refund/`, () =>
        HttpResponse.json({ id: 'rfd-2', amount: 1500, status: 'REFUNDED' }),
      ),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), {
      target: { value: 'Cancelacion total por solicitud' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(await screen.findByText(/Reembolso procesado/i)).toBeInTheDocument();
  });

  it('muestra historial de reembolsos anteriores', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
      http.get(`${BASE}/api/v1/admin/payments/501/refunds/`, () =>
        HttpResponse.json([
          { id: 1, amount: '200.00', status: 'APPROVED', gateway_refund_id: 'REF-001', reason: 'Parcial' },
          { id: 2, amount: '100.00', status: 'APPROVED', gateway_refund_id: 'REF-002', reason: '' },
        ]),
      ),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });
    expect(await screen.findByRole('region', { name: /Reembolsos anteriores/i })).toBeInTheDocument();
    expect(screen.getByText('REF-001')).toBeInTheDocument();
    expect(screen.getByText('REF-002')).toBeInTheDocument();
    expect(screen.getByText('Parcial')).toBeInTheDocument();
  });

  it('no muestra seccion de historial si no hay reembolsos', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
      http.get(`${BASE}/api/v1/admin/payments/501/refunds/`, () => HttpResponse.json([])),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByRole('region', { name: /Reembolsos anteriores/i })).not.toBeInTheDocument();
  });

  it('muestra boton cancelar solo para pagos PENDING', async () => {
    const pendingPayment = { ...APPROVED_PAYMENT, status: 'PENDING' };
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(pendingPayment)),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });
    expect(screen.getByRole('button', { name: /Cancelar pago/i })).toBeInTheDocument();
  });

  it('no muestra boton cancelar para pagos APPROVED', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });
    expect(screen.queryByRole('button', { name: /Cancelar pago/i })).not.toBeInTheDocument();
  });

  it('cancela el pago y muestra confirmacion', async () => {
    const pendingPayment = { ...APPROVED_PAYMENT, id: 502, status: 'PENDING' };
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/502/`, () => HttpResponse.json(pendingPayment)),
      http.post(`${BASE}/api/v1/admin/payments/502/cancel/`, () =>
        HttpResponse.json({ ...pendingPayment, status: 'CANCELLED' }),
      ),
    );
    const store = makeStore();
    render(wrap(<AdminPaymentRefundPage />, store, '/admin/payments/502/refund'));

    await screen.findByRole('button', { name: /Cancelar pago/i });
    fireEvent.click(screen.getByRole('button', { name: /Cancelar pago/i }));

    expect(await screen.findByText(/Pago cancelado correctamente/i)).toBeInTheDocument();
  });

  it('muestra error si el gateway rechaza el reembolso', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/501/`, () => HttpResponse.json(APPROVED_PAYMENT)),
    );
    server.use(
      http.post(`${BASE}/api/v2/payments/admin/:paymentId/refund/`, () =>
        HttpResponse.json(
          { codigo_error: 'GATEWAY_ERROR', detail: 'GATEWAY_ERROR' },
          { status: 400 },
        ),
      ),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'Reembolso parcial test' } });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/GATEWAY_ERROR/);
  });

  it('muestra error si la cancelacion falla', async () => {
    const pendingPayment = { ...APPROVED_PAYMENT, id: 503, status: 'PENDING' };
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/503/`, () => HttpResponse.json(pendingPayment)),
      http.post(`${BASE}/api/v1/admin/payments/503/cancel/`, () =>
        HttpResponse.json(
          { codigo_error: 'GATEWAY_UNAVAILABLE', detail: 'MP down' },
          { status: 400 },
        ),
      ),
    );
    render(wrap(<AdminPaymentRefundPage />, makeStore(), '/admin/payments/503/refund'));

    await screen.findByRole('button', { name: /Cancelar pago/i });
    fireEvent.click(screen.getByRole('button', { name: /Cancelar pago/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
