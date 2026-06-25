/**
 * Tests — PaymentStatusPage
 * UC-PAY-05: Ver estado actual del pago de una orden propia.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import PaymentStatusPage from './PaymentStatusPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, path = '/account/orders/ORD-1/payment') => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/account/orders/:orderId/payment" element={ui} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

const APPROVED_PAYMENT = {
  id: 'pay_1',
  order_id: 'ORD-1',
  status: 'APPROVED',
  gateway: 'mercadopago',
  amount: 1250.5,
  currency: 'MXN',
  installments: 6,
  paid_at: '2026-05-10T12:00:00Z',
};

describe('PaymentStatusPage (UC-PAY-05)', () => {
  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v2/payments/:orderId/status/`, () =>
        HttpResponse.json(APPROVED_PAYMENT),
      ),
    );
    render(wrap(<PaymentStatusPage />));
    expect(
      await screen.findByRole('heading', { name: /Estado del pago/i })
    ).toBeInTheDocument();
  });

  it('consulta el endpoint con orderId en la ruta', async () => {
    let requestUrl;
    server.use(
      http.get(`${BASE}/api/v2/payments/:orderId/status/`, ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(APPROVED_PAYMENT);
      }),
    );
    render(wrap(<PaymentStatusPage />));
    await screen.findByRole('heading', { name: /Estado del pago/i });
    expect(requestUrl).toContain('/api/v2/payments/ORD-1/status/');
  });

  it('renderiza el estado, gateway, monto y fecha en español', async () => {
    server.use(
      http.get(`${BASE}/api/v2/payments/:orderId/status/`, () =>
        HttpResponse.json(APPROVED_PAYMENT),
      ),
    );
    render(wrap(<PaymentStatusPage />));
    expect(await screen.findByText(/Aprobado/i)).toBeInTheDocument();
    expect(screen.getByText(/Mercado Pago/i)).toBeInTheDocument();
    expect(screen.getByText(/6 cuotas/i)).toBeInTheDocument();
  });

  it('muestra "Sin intentos de pago" si no hay registros', async () => {
    server.use(
      http.get(`${BASE}/api/v2/payments/:orderId/status/`, () =>
        HttpResponse.json(null),
      ),
    );
    render(wrap(<PaymentStatusPage />));
    expect(
      await screen.findByText(/No hay intentos de pago registrados/i)
    ).toBeInTheDocument();
  });

  it('muestra estado de pago rechazado con codigo de error', async () => {
    server.use(
      http.get(`${BASE}/api/v2/payments/:orderId/status/`, () =>
        HttpResponse.json({ ...APPROVED_PAYMENT, status: 'REJECTED', error_code: 'PAGO_RECHAZADO' }),
      ),
    );
    render(wrap(<PaymentStatusPage />));
    expect(await screen.findByText(/^Rechazado$/i)).toBeInTheDocument();
    expect(screen.getByText(/PAGO_RECHAZADO/)).toBeInTheDocument();
  });

  it('para pago rechazado o pendiente ofrece enlace para reintentar', async () => {
    server.use(
      http.get(`${BASE}/api/v2/payments/:orderId/status/`, () =>
        HttpResponse.json({ ...APPROVED_PAYMENT, status: 'REJECTED' }),
      ),
    );
    render(wrap(<PaymentStatusPage />));
    const retry = await screen.findByRole('link', { name: /Reintentar pago/i });
    expect(retry).toHaveAttribute('href', '/account/orders/ORD-1/payment/retry');
  });
});
