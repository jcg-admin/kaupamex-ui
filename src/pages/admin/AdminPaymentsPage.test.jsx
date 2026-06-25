/**
 * Tests — AdminPaymentsPage
 * UC-PAY-11: Reporte de transacciones de pago (admin).
 */
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter }  from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import AdminPaymentsPage from './AdminPaymentsPage';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui) => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const RESPONSE = {
  results: [
    { id: 1, order_number: 'ORD-1', status: 'APPROVED', gateway: 'mercadopago', amount: 1000, currency: 'MXN', created_at: '2026-05-10T12:00:00Z' },
    { id: 2, order_number: 'ORD-2', status: 'REJECTED', gateway: 'paypal',      amount: 500,  currency: 'MXN', created_at: '2026-05-09T12:00:00Z', error_code: 'CARD_DECLINED' },
    { id: 3, order_number: 'ORD-3', status: 'REFUNDED', gateway: 'mercadopago', amount: 300,  currency: 'MXN', created_at: '2026-05-08T12:00:00Z', is_refund: true },
  ],
  count: 3,
  totals: { approved: 1000, refunded: 300, net: 700 },
};

describe('AdminPaymentsPage (UC-PAY-11)', () => {
  it('muestra el titulo del reporte', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminPaymentsPage />));
    expect(
      await screen.findByRole('heading', { name: /Reporte de transacciones/i })
    ).toBeInTheDocument();
  });

  it('lista los pagos con sus estados, gateways y montos', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminPaymentsPage />));
    expect(await screen.findByText('ORD-1')).toBeInTheDocument();
    expect(screen.getByText('ORD-2')).toBeInTheDocument();
    expect(screen.getByText('ORD-3')).toBeInTheDocument();
    // El gateway aparece en la tabla — basta con que existan multiples instancias.
    expect(screen.getAllByText(/Mercado Pago/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/PayPal/).length).toBeGreaterThan(0);
  });

  it('muestra los totales del periodo (cobros / reembolsos / neto)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminPaymentsPage />));
    expect(await screen.findByText(/Aprobados:/i)).toBeInTheDocument();
    expect(screen.getByText(/Reembolsados:/i)).toBeInTheDocument();
    expect(screen.getByText(/Neto:/i)).toBeInTheDocument();
  });

  it('integra DateRangePicker (B2) en vez de inputs type=date crudos', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () => HttpResponse.json(RESPONSE)),
    );
    const { container } = render(wrap(<AdminPaymentsPage />));
    await screen.findByText('ORD-1');
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(screen.getByPlaceholderText('Desde')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hasta')).toBeInTheDocument();
  });

  it('aplica filtro por estado y por gateway al endpoint', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminPaymentsPage />));
    await screen.findByText('ORD-1');

    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, ({ request }) => {
        lastUrl = request.url;
        return HttpResponse.json(RESPONSE);
      }),
    );

    fireEvent.change(screen.getByLabelText(/Estado/i), { target: { value: 'APPROVED' } });
    fireEvent.change(screen.getByLabelText(/Gateway/i), { target: { value: 'mercadopago' } });

    await screen.findByText('ORD-1');
    expect(lastUrl).toContain('/api/v2/admin/payments/');
    expect(lastUrl).toContain('status=APPROVED');
    expect(lastUrl).toContain('gateway=mercadopago');
  });

  it('muestra enlace para procesar reembolso en pagos APPROVED', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminPaymentsPage />));
    const refundLink = await screen.findByRole('link', { name: /Procesar reembolso/i });
    expect(refundLink).toHaveAttribute('href', '/admin/payments/1/refund');
  });

  it('estado vacio cuando no hay transacciones', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () =>
        HttpResponse.json({ results: [], count: 0, totals: null }),
      ),
    );
    render(wrap(<AdminPaymentsPage />));
    expect(await screen.findByText(/No hay transacciones/i)).toBeInTheDocument();
  });

  // Migración a DataTable (US-2.1): la lista se renderiza en la tabla
  // reutilizable con ordenamiento por columna (cliente, monto numérico).
  it('ordena las transacciones por monto al hacer clic en el header', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/payments/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminPaymentsPage />));
    await screen.findByText('ORD-1');

    function orderCells() {
      // La columna Orden es la 2ª celda (índice 1): col[0] es el id del pago.
      return screen.getAllByRole('row')
        .slice(1)
        .map((r) => within(r).queryAllByRole('cell')[1]?.textContent)
        .filter(Boolean);
    }

    // Orden natural (orden de llegada): montos 1000, 500, 300.
    expect(orderCells()).toEqual(['ORD-1', 'ORD-2', 'ORD-3']);

    // Ascendente por Monto → 300, 500, 1000 = ORD-3, ORD-2, ORD-1.
    fireEvent.click(screen.getByRole('button', { name: /Monto/i }));
    expect(orderCells()).toEqual(['ORD-3', 'ORD-2', 'ORD-1']);

    // Descendente por Monto → 1000, 500, 300.
    fireEvent.click(screen.getByRole('button', { name: /Monto/i }));
    expect(orderCells()).toEqual(['ORD-1', 'ORD-2', 'ORD-3']);

    expect(
      screen.getByRole('button', { name: /Monto/i }).closest('th'),
    ).toHaveAttribute('aria-sort', 'descending');
  });
});
