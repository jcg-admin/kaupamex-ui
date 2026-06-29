/**
 * Tests — AdminChargebacksPage (T-17-B)
 */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import AdminChargebacksPage from './AdminChargebacksPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = (ui) => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter>{ui}</MemoryRouter>
  </QueryClientProvider>
);

const CHARGEBACKS = [
  {
    id: 1, gateway_chargeback_id: 'GCB-001', gateway_payment_id: 'MP-A',
    amount: '500.00', status: 'pending', reason_code: 'chargeback_fraud',
    description: '', created_at: '2026-06-27T10:00:00',
  },
  {
    id: 2, gateway_chargeback_id: 'GCB-002', gateway_payment_id: 'MP-B',
    amount: '300.00', status: 'lost', reason_code: 'chargeback_no_response',
    description: '', created_at: '2026-06-27T11:00:00',
  },
];

describe('AdminChargebacksPage (T-17-B)', () => {
  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/chargebacks/`, () => HttpResponse.json([])),
    );
    render(wrap(<AdminChargebacksPage />));
    expect(await screen.findByRole('heading', { name: /Contracargos/i })).toBeInTheDocument();
  });

  it('lista los contracargos disponibles', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/chargebacks/`, () => HttpResponse.json(CHARGEBACKS)),
    );
    render(wrap(<AdminChargebacksPage />));
    expect(await screen.findByText('GCB-001')).toBeInTheDocument();
    expect(screen.getByText('GCB-002')).toBeInTheDocument();
    expect(screen.getByText('chargeback_fraud')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay contracargos', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/chargebacks/`, () => HttpResponse.json([])),
    );
    render(wrap(<AdminChargebacksPage />));
    expect(await screen.findByText(/No hay contracargos/i)).toBeInTheDocument();
  });

  it('muestra error si la carga falla', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/chargebacks/`, () =>
        HttpResponse.json({ detail: 'forbidden' }, { status: 403 }),
      ),
    );
    render(wrap(<AdminChargebacksPage />));
    expect(
      await screen.findByText(/Error al cargar contracargos/i)
    ).toBeInTheDocument();
  });
});
