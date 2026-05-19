/**
 * Tests — PaymentHistoryPage
 * UC-PAY-06: Ver historial de pagos de una orden.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import PaymentHistoryPage from './PaymentHistoryPage';

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, path = '/account/orders/ORD-9/payments') => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/account/orders/:orderId/payments" element={ui} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

afterEach(() => jest.clearAllMocks());

const HISTORY = [
  { id: 'p3', status: 'APPROVED', gateway: 'mercadopago', amount: 1000, currency: 'MXN', created_at: '2026-05-10T12:00:00Z' },
  { id: 'p2', status: 'REJECTED', gateway: 'mercadopago', amount: 1000, currency: 'MXN', created_at: '2026-05-09T12:00:00Z', error_code: 'PAGO_RECHAZADO' },
  { id: 'r1', status: 'REFUNDED', gateway: 'mercadopago', amount: 300,  currency: 'MXN', created_at: '2026-05-12T12:00:00Z', is_refund: true },
];

describe('PaymentHistoryPage (UC-PAY-06)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: HISTORY } });
    render(wrap(<PaymentHistoryPage />));
    expect(
      await screen.findByRole('heading', { name: /Historial de pagos/i })
    ).toBeInTheDocument();
  });

  it('lista los intentos con su estado y fecha', async () => {
    apiService.get.mockResolvedValue({ data: { results: HISTORY } });
    render(wrap(<PaymentHistoryPage />));
    expect(await screen.findByText(/^Aprobado$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Rechazado$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Reembolsado$/i)).toBeInTheDocument();
  });

  it('marca explicitamente las filas de reembolso', async () => {
    apiService.get.mockResolvedValue({ data: { results: HISTORY } });
    render(wrap(<PaymentHistoryPage />));
    const refundRow = await screen.findByText(/^Reembolso$/);
    expect(refundRow).toBeInTheDocument();
  });

  it('muestra estado vacio cuando la orden no tiene pagos', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    render(wrap(<PaymentHistoryPage />));
    expect(
      await screen.findByText(/No hay pagos registrados/i)
    ).toBeInTheDocument();
  });

  it('consulta el endpoint correcto con order_id', async () => {
    apiService.get.mockResolvedValue({ data: { results: HISTORY } });
    render(wrap(<PaymentHistoryPage />));
    await screen.findByRole('heading', { name: /Historial de pagos/i });
    expect(apiService.get).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/payments/?order_id=ORD-9'),
      expect.any(Object)
    );
  });
});
