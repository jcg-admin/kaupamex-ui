/**
 * Tests — PaymentRetryPage
 * UC-PAY-08: Reintentar pago fallido (eventualmente cambiando gateway).
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@pages/checkout/paymentRedirect', () => ({
  __esModule: true,
  redirectToGateway: jest.fn(),
}));

import { redirectToGateway } from '@pages/checkout/paymentRedirect';
import paymentsReducer from '@redux/slices/paymentsSlice';
import PaymentRetryPage from './PaymentRetryPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () => configureStore({ reducer: { payments: paymentsReducer } });

const wrap = (ui, store, path = '/account/orders/ORD-7/payment/retry') => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/account/orders/:orderId/payment/retry" element={ui} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

describe('PaymentRetryPage (UC-PAY-08)', () => {
  it('muestra el titulo y opciones de gateway', () => {
    render(wrap(<PaymentRetryPage />, makeStore()));
    expect(screen.getByRole('heading', { name: /Reintentar pago/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Mercado Pago/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PayPal/i)).toBeInTheDocument();
  });

  it('reintenta el pago con el gateway elegido (PayPal) y redirige', async () => {
    // DEC-BC-09: contract unificado. order_number (no order_id),
    // gateway uppercase canon (PAYPAL no paypal), response trae
    // `checkout_url` (no approve_url separado).
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/payments/initiate/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({
          payment_id:   456,
          checkout_url: 'https://paypal.example/r/9',
          order_number: 'ORD-7',
        });
      }),
    );
    render(wrap(<PaymentRetryPage />, makeStore()));
    fireEvent.click(screen.getByLabelText(/PayPal/i));
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({ order_number: 'ORD-7', gateway: 'PAYPAL' });
    });
    await waitFor(() => {
      expect(redirectToGateway).toHaveBeenCalledWith('https://paypal.example/r/9');
    });
  });

  it('muestra mensaje de error si la orden expiro', async () => {
    // Use 400 with codigo_error so apiService propagates ORDER_EXPIRED as error.code.
    // A raw 409 becomes ConflictError(code='CONFLICT') which is not ORDER_EXPIRED.
    server.use(
      http.post(`${BASE}/api/v1/payments/initiate/`, () =>
        HttpResponse.json(
          { detail: 'ORDER_EXPIRED', codigo_error: 'ORDER_EXPIRED' },
          { status: 400 },
        ),
      ),
    );
    render(wrap(<PaymentRetryPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    // DEC-BC-21 + canon-idioma: identifiers EN canonico. UI emite
    // ORDER_EXPIRED; el test asertaba ES (outlier).
    expect(await screen.findByRole('alert')).toHaveTextContent(/ORDER_EXPIRED/);
  });
});
