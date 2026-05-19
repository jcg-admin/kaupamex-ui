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

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('./paymentRedirect', () => ({
  __esModule: true,
  redirectToGateway: jest.fn(),
}));

import apiService from '@services/apiService';
import { redirectToGateway } from './paymentRedirect';
import paymentsReducer from '@redux/slices/paymentsSlice';
import PaymentSelectionPage from './PaymentSelectionPage';

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

  it('UC-PAY-01: inicia pago MP y redirige al gateway', async () => {
    apiService.post.mockResolvedValue({
      data: { preference_id: 'pref_123', payment_url: 'https://mp.example/pay/123' },
    });
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Pagar con Mercado Pago/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/payments/mercadopago/checkout',
        { order_id: 'ORD-001' }
      );
    });
    await waitFor(() => {
      expect(redirectToGateway).toHaveBeenCalledWith('https://mp.example/pay/123');
    });
  });

  it('UC-PAY-01-EXT: incluye installments cuando MSI esta seleccionado', async () => {
    apiService.post.mockResolvedValue({
      data: { preference_id: 'pref_msi', payment_url: 'https://mp.example/pay/msi' },
    });
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Cuotas sin intereses/i), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /Pagar con Mercado Pago/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/payments/mercadopago/checkout',
        { order_id: 'ORD-001', installments: 6 }
      );
    });
  });

  it('UC-PAY-02: inicia pago PayPal y redirige al approve_url', async () => {
    apiService.post.mockResolvedValue({
      data: { paypal_order_id: 'PP-9', approve_url: 'https://paypal.example/approve/9' },
    });
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Pagar con PayPal/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/payments/paypal/checkout',
        { order_id: 'ORD-001' }
      );
    });
    await waitFor(() => {
      expect(redirectToGateway).toHaveBeenCalledWith('https://paypal.example/approve/9');
    });
  });

  it('muestra mensaje de error si el gateway falla', async () => {
    apiService.post.mockRejectedValue({
      message: 'AMOUNT_MISMATCH', code: 'AMOUNT_MISMATCH', status: 422,
    });
    render(wrap(<PaymentSelectionPage />, makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Pagar con Mercado Pago/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/AMOUNT_MISMATCH/);
  });
});
