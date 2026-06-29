/**
 * Tests — AdminChargebackDetailPage (T-17-C)
 */
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import AdminChargebackDetailPage from './AdminChargebackDetailPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrap = (chargebackId = '1') => (
  <QueryClientProvider client={makeClient()}>
    <MemoryRouter initialEntries={[`/admin/chargebacks/${chargebackId}`]}>
      <Routes>
        <Route path="/admin/chargebacks/:chargebackId" element={<AdminChargebackDetailPage />} />
      </Routes>
    </MemoryRouter>
  </QueryClientProvider>
);

const CB_DETAIL = {
  id: 1, gateway_chargeback_id: 'GCB-001', gateway_payment_id: 'MP-A',
  amount: '500.00', status: 'pending', reason_code: 'chargeback_fraud',
  description: 'Customer claims fraud', created_at: '2026-06-27T10:00:00',
};

describe('AdminChargebackDetailPage (T-17-C)', () => {
  it('muestra el detalle del contracargo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/chargebacks/1/`, () => HttpResponse.json(CB_DETAIL)),
    );
    render(wrap('1'));
    expect(await screen.findByRole('heading', { name: /Contracargo/i })).toBeInTheDocument();
    expect(screen.getByText('GCB-001')).toBeInTheDocument();
    expect(screen.getByText('chargeback_fraud')).toBeInTheDocument();
    expect(screen.getByText('Customer claims fraud')).toBeInTheDocument();
  });

  it('muestra error si no se encuentra el contracargo', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/chargebacks/999/`, () =>
        HttpResponse.json({ detail: 'Not found.' }, { status: 404 }),
      ),
    );
    render(wrap('999'));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no encontrado/i);
  });
});
