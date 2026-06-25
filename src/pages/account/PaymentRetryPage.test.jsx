/**
 * Tests — PaymentRetryPage
 * UC-PAY-08: Reintentar pago fallido (eventualmente cambiando gateway).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('@pages/checkout/paymentRedirect', () => ({
  __esModule: true,
  redirectToGateway: jest.fn(),
}));

import apiService from '@services/apiService';
import { redirectToGateway } from '@pages/checkout/paymentRedirect';
import paymentsReducer from '@redux/slices/paymentsSlice';
import PaymentRetryPage from './PaymentRetryPage';

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

afterEach(() => jest.clearAllMocks());

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
    apiService.post.mockResolvedValue({
      data: {
        payment_id:   456,
        checkout_url: 'https://paypal.example/r/9',
        order_number: 'ORD-7',
      },
    });
    render(wrap(<PaymentRetryPage />, makeStore()));
    fireEvent.click(screen.getByLabelText(/PayPal/i));
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v2/payments/initiate/',
        { order_number: 'ORD-7', gateway: 'PAYPAL' }
      );
    });
    await waitFor(() => {
      expect(redirectToGateway).toHaveBeenCalledWith('https://paypal.example/r/9');
    });
  });

  it('muestra mensaje de error si la orden expiro', async () => {
    apiService.post.mockRejectedValue({
      message: 'ORDER_EXPIRED', code: 'ORDER_EXPIRED', status: 409,
    });
    render(wrap(<PaymentRetryPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    // DEC-BC-21 + canon-idioma: identifiers EN canonico. UI emite
    // ORDER_EXPIRED; el test asertaba ES (outlier).
    expect(await screen.findByRole('alert')).toHaveTextContent(/ORDER_EXPIRED/);
  });
});
