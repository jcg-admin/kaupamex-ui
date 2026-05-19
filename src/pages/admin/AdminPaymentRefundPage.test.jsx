/**
 * Tests — AdminPaymentRefundPage
 * UC-PAY-09: El admin procesa manualmente un reembolso sobre un Payment APPROVED.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
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
  order_id: 'ORD-88',
};

afterEach(() => jest.clearAllMocks());

describe('AdminPaymentRefundPage (UC-PAY-09)', () => {
  it('muestra el titulo y la informacion del pago', async () => {
    apiService.get.mockResolvedValue({ data: APPROVED_PAYMENT });
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    expect(
      await screen.findByRole('heading', { name: /Procesar reembolso/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/ORD-88/)).toBeInTheDocument();
  });

  it('envia el reembolso con monto y motivo', async () => {
    apiService.get.mockResolvedValue({ data: APPROVED_PAYMENT });
    apiService.post.mockResolvedValue({
      data: { id: 'rfd-1', amount: 500, status: 'REFUNDED' },
    });
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), {
      target: { value: 'Reembolso de cortesia por incidente' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/v1/admin/payments/501/refund/',
        { amount: 500, reason: 'Reembolso de cortesia por incidente' }
      );
    });
  });

  it('rechaza el envio si el motivo esta vacio', async () => {
    apiService.get.mockResolvedValue({ data: APPROVED_PAYMENT });
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/Motivo es obligatorio/i)).toBeInTheDocument();
  });

  it('rechaza monto mayor al pago', async () => {
    apiService.get.mockResolvedValue({ data: APPROVED_PAYMENT });
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'Test refund completo' } });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(apiService.post).not.toHaveBeenCalled();
    expect(screen.getByText(/no puede superar el monto del pago/i)).toBeInTheDocument();
  });

  it('muestra confirmacion tras un reembolso exitoso', async () => {
    apiService.get.mockResolvedValue({ data: APPROVED_PAYMENT });
    apiService.post.mockResolvedValue({
      data: { id: 'rfd-2', amount: 1500, status: 'REFUNDED' },
    });
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), {
      target: { value: 'Cancelacion total por solicitud' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(await screen.findByText(/Reembolso procesado/i)).toBeInTheDocument();
  });

  it('muestra error si el gateway rechaza el reembolso', async () => {
    apiService.get.mockResolvedValue({ data: APPROVED_PAYMENT });
    apiService.post.mockRejectedValue({
      message: 'GATEWAY_ERROR', code: 'GATEWAY_ERROR', status: 502,
    });
    render(wrap(<AdminPaymentRefundPage />, makeStore()));
    await screen.findByRole('heading', { name: /Procesar reembolso/i });

    fireEvent.change(screen.getByLabelText(/Monto/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'Reembolso parcial test' } });
    fireEvent.click(screen.getByRole('button', { name: /Procesar reembolso/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/GATEWAY_ERROR/);
  });
});
