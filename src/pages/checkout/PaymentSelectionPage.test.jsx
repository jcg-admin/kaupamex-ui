/**
 * Tests — PaymentSelectionPage
 * UC-PAY-01: Iniciar pago con Mercado Pago
 * UC-PAY-02: Iniciar pago con PayPal
 * UC-PAY-01-EXT: Pago con Cuotas MSI (opcion dentro de MP)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

jest.mock('./paymentRedirect', () => ({
  __esModule: true,
  redirectToGateway: jest.fn(),
}));

import { redirectToGateway } from './paymentRedirect';
import paymentsReducer from '@redux/slices/paymentsSlice';
import PaymentSelectionPage from './PaymentSelectionPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { payments: paymentsReducer } });

const wrap = (ui, store, path = '/checkout/payment/ORD-001') => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/checkout/payment/:orderId" element={ui} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

afterEach(() => {
  jest.clearAllMocks();
});

describe('PaymentSelectionPage', () => {
  it('muestra el titulo y los gateways disponibles', () => {
    render(wrap(<PaymentSelectionPage />, makeStore()));
    expect(screen.getByRole('heading', { name: /Elige tu metodo de pago/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar con Mercado Pago/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pagar con PayPal/i })).toBeInTheDocument();
  });

  it('UC-PAY-01: inicia pago MP y redirige al checkout_url', async () => {
    // DEC-BC-09: backend devuelve `checkout_url` (unificado) en endpoint
    // unico `/api/v2/payments/initiate/` con body
    // `{ order_number, gateway: 'MERCADOPAGO', installments? }`.
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          payment_id:   123,
          checkout_url: 'https://mp.example/pay/123',
          order_number: 'ORD-001',
          amount:       '500.00',
          installments: 1,
        }),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Pagar con Mercado Pago/i }));

    await waitFor(() => {
      expect(redirectToGateway).toHaveBeenCalledWith('https://mp.example/pay/123');
    });
  });

  it('UC-PAY-01-EXT: incluye installments cuando MSI esta seleccionado', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          payment_id: 124,
          checkout_url: 'https://mp.example/pay/msi',
          order_number: 'ORD-001',
          amount: '500.00',
          installments: 6,
        }),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Cuotas sin intereses/i), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /Pagar con Mercado Pago/i }));

    await waitFor(() => {
      expect(redirectToGateway).toHaveBeenCalledWith('https://mp.example/pay/msi');
    });
  });

  it('UC-PAY-02: inicia pago PayPal y redirige al checkout_url', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json({
          payment_id:   125,
          checkout_url: 'https://paypal.example/approve/9',
          order_number: 'ORD-001',
          amount:       '500.00',
          installments: 1,
        }),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Pagar con PayPal/i }));

    await waitFor(() => {
      expect(redirectToGateway).toHaveBeenCalledWith('https://paypal.example/approve/9');
    });
  });

  it('muestra mensaje de error si el gateway falla', async () => {
    server.use(
      http.post(`${BASE}/api/v2/payments/initiate/`, () =>
        HttpResponse.json(
          { detail: 'AMOUNT_MISMATCH', codigo_error: 'AMOUNT_MISMATCH' },
          { status: 422 },
        ),
      ),
    );
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Pagar con Mercado Pago/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/AMOUNT_MISMATCH/);
  });
});
