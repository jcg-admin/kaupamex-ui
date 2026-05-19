/**
 * Tests — AdminPaymentsPage
 * UC-PAY-11: Reporte de transacciones de pago (admin).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter }  from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import AdminPaymentsPage from './AdminPaymentsPage';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const RESPONSE = {
  results: [
    { id: 1, order_id: 'ORD-1', status: 'APPROVED', gateway: 'mercadopago', amount: 1000, currency: 'MXN', created_at: '2026-05-10T12:00:00Z' },
    { id: 2, order_id: 'ORD-2', status: 'REJECTED', gateway: 'paypal',      amount: 500,  currency: 'MXN', created_at: '2026-05-09T12:00:00Z', error_code: 'CARD_DECLINED' },
    { id: 3, order_id: 'ORD-3', status: 'REFUNDED', gateway: 'mercadopago', amount: 300,  currency: 'MXN', created_at: '2026-05-08T12:00:00Z', is_refund: true },
  ],
  count: 3,
  totals: { approved: 1000, refunded: 300, net: 700 },
};

afterEach(() => jest.clearAllMocks());

describe('AdminPaymentsPage (UC-PAY-11)', () => {
  it('muestra el titulo del reporte', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminPaymentsPage />));
    expect(
      await screen.findByRole('heading', { name: /Reporte de transacciones/i })
    ).toBeInTheDocument();
  });

  it('lista los pagos con sus estados, gateways y montos', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminPaymentsPage />));
    expect(await screen.findByText('ORD-1')).toBeInTheDocument();
    expect(screen.getByText('ORD-2')).toBeInTheDocument();
    expect(screen.getByText('ORD-3')).toBeInTheDocument();
    // El gateway aparece en la tabla — basta con que existan multiples instancias.
    expect(screen.getAllByText(/Mercado Pago/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PayPal/).length).toBeGreaterThan(0);
  });

  it('muestra los totales del periodo (cobros / reembolsos / neto)', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminPaymentsPage />));
    expect(await screen.findByText(/Aprobados:/i)).toBeInTheDocument();
    expect(screen.getByText(/Reembolsados:/i)).toBeInTheDocument();
    expect(screen.getByText(/Neto:/i)).toBeInTheDocument();
  });

  it('aplica filtro por estado y por gateway al endpoint', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminPaymentsPage />));
    await screen.findByText('ORD-1');

    fireEvent.change(screen.getByLabelText(/Estado/i), { target: { value: 'APPROVED' } });
    fireEvent.change(screen.getByLabelText(/Gateway/i), { target: { value: 'mercadopago' } });

    expect(apiService.get).toHaveBeenLastCalledWith(
      '/api/v1/admin/payments/',
      expect.objectContaining({
        params: expect.objectContaining({ status: 'APPROVED', gateway: 'mercadopago' }),
      })
    );
  });

  it('muestra enlace para procesar reembolso en pagos APPROVED', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminPaymentsPage />));
    const refundLink = await screen.findByRole('link', { name: /Procesar reembolso/i });
    expect(refundLink).toHaveAttribute('href', '/admin/payments/1/refund');
  });

  it('estado vacio cuando no hay transacciones', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], count: 0, totals: null } });
    render(wrap(<AdminPaymentsPage />));
    expect(await screen.findByText(/No hay transacciones/i)).toBeInTheDocument();
  });
});
