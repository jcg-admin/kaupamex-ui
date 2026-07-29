/**
 * Tests AdminPlatformBillingPage — consola de facturación L0 (UC-PLT-18, slice 4).
 *
 * Verifica que la página:
 *   - lista las corridas de facturación (período, facturas, monto, fallos),
 *   - dispara una corrida manual con POST /billing/runs/,
 *   - al elegir una empresa lista sus facturas con estado (Badge),
 *   - reintenta una factura fallida con POST /invoices/<id>/retry/,
 *   - traduce el 503 (pasarela no cableada) a feedback, sin romper.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { formatCurrency } from '@lib/intl';

import AdminPlatformBillingPage from './AdminPlatformBillingPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const RUNS = [
  {
    run_id: 7, period: '2026-08', triggered_by: 'operator', invoices_issued: 3,
    amount_charged: '597.00', currency: 'MXN', failures: 1,
    started_at: '2026-08-01T09:00:00Z', finished_at: '2026-08-01T09:00:12Z',
  },
];

const COMPANIES = [
  { id: 2, code: 'tiendamexico', name: 'Tienda México', status: 'active' },
];

const INVOICES = [
  {
    id: 41, company: 2, company_code: 'tiendamexico', subscription: 10,
    module_code: 'catalogue', run: 7, period: '2026-08', amount: '199.00',
    currency: 'MXN', status: 'paid', issued_at: '2026-08-01T09:00:00Z',
    paid_at: '2026-08-01T09:00:05Z', failure_reason: '',
  },
  {
    id: 42, company: 2, company_code: 'tiendamexico', subscription: 11,
    module_code: 'pos', run: 7, period: '2026-08', amount: '398.00',
    currency: 'MXN', status: 'failed', issued_at: '2026-08-01T09:00:00Z',
    paid_at: null, failure_reason: 'Cobro rechazado por la pasarela',
  },
];

function seed({ runs = RUNS, companies = COMPANIES, invoices = INVOICES } = {}) {
  server.use(
    http.get(`${BASE}/api/v2/platform/billing/runs/`, () => HttpResponse.json(runs)),
    http.get(`${BASE}/api/v2/platform/companies/`, () => HttpResponse.json(companies)),
    http.get(`${BASE}/api/v2/platform/companies/2/invoices/`, () => HttpResponse.json(invoices)),
  );
}

function wrap() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPlatformBillingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminPlatformBillingPage', () => {
  it('lista las corridas de facturación', async () => {
    seed();
    wrap();
    await waitFor(() => expect(screen.getByText('2026-08')).toBeInTheDocument());
    const table = within(screen.getAllByRole('table')[0]);
    // La celda rinde el monto con `lib/intl` (es-MX + divisa de la fila), o sea
    // "$597.00" en un solo nodo: un match exacto de '597.00' no existe.
    expect(table.getByText(formatCurrency('597.00', { currency: 'MXN' })))
      .toBeInTheDocument();
  });

  it('dispara una corrida manual con POST a billing/runs/', async () => {
    seed();
    let posted = false;
    server.use(
      http.post(`${BASE}/api/v2/platform/billing/runs/`, () => {
        posted = true;
        return HttpResponse.json(
          { run_id: 8, period: '2026-09', triggered_by: 'operator',
            invoices_issued: 0, amount_charged: '0.00', currency: 'MXN',
            failures: 0, started_at: '2026-09-01T09:00:00Z', finished_at: null },
          { status: 202 },
        );
      }),
    );
    wrap();
    await waitFor(() => expect(screen.getByText('2026-08')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Ejecutar corrida/i }));
    await waitFor(() => expect(posted).toBe(true));
  });

  it('lista las facturas de la empresa seleccionada con su estado', async () => {
    seed();
    wrap();
    await waitFor(() => expect(screen.getByText('2026-08')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText('Empresa'), '2');
    await waitFor(() => expect(screen.getByText('catalogue')).toBeInTheDocument());
    expect(screen.getByText('pos')).toBeInTheDocument();
    // Estado por texto (Badge), no solo color.
    expect(screen.getByText('Pagada')).toBeInTheDocument();
    expect(screen.getByText('Cobro fallido')).toBeInTheDocument();
  });

  it('reintenta una factura fallida con POST a invoices/<id>/retry/', async () => {
    seed();
    let retried = 0;
    server.use(
      http.post(`${BASE}/api/v2/platform/invoices/42/retry/`, () => {
        retried += 1;
        return HttpResponse.json({ ...INVOICES[1], status: 'paid', failure_reason: '' });
      }),
    );
    wrap();
    await waitFor(() => expect(screen.getByText('2026-08')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText('Empresa'), '2');
    await waitFor(() => expect(screen.getByText('pos')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    await waitFor(() => expect(retried).toBe(1));
  });

  it('traduce el 503 de pasarela no cableada a feedback', async () => {
    seed();
    server.use(
      http.post(`${BASE}/api/v2/platform/invoices/42/retry/`, () =>
        HttpResponse.json(
          { codigo_error: 'GATEWAY_NOT_CONFIGURED', detail: 'Adaptador de cobro no cableado.' },
          { status: 503 },
        ),
      ),
    );
    wrap();
    await waitFor(() => expect(screen.getByText('2026-08')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText('Empresa'), '2');
    await waitFor(() => expect(screen.getByText('pos')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Reintentar/i }));
    await waitFor(() =>
      expect(screen.getByText(/pasarela|cableado|no se pudo/i)).toBeInTheDocument(),
    );
  });
});
