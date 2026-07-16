/**
 * Tests AdminPlatformPricingPage — catálogo de tarifas L0 (UC-PLT-18).
 *
 * Verifica que la página:
 *   - lista las tarifas (módulo, ciclo, precio),
 *   - da de alta una tarifa con POST a module-prices/,
 *   - muestra el estado vacío.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import AdminPlatformPricingPage from './AdminPlatformPricingPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const MODULES = [
  { id: 10, code: 'catalogue', name: 'Ecommerce', is_application: true, tier: 'free', category: 'Order Management', version: '1.0', description: '', depends: [], is_active: true },
  { id: 12, code: 'inventory', name: 'Inventario', is_application: true, tier: 'free', category: 'Supply Chain Management', version: '1.0', description: '', depends: [], is_active: true },
];
const PRICES = [
  { id: 100, module: 10, module_code: 'catalogue', billing_cycle: 'monthly', price: '199.00', currency: 'MXN', effective_from: '2026-01-01T00:00:00Z', effective_to: null, created_at: null },
];

function wrap(prices = PRICES) {
  server.use(
    http.get(`${BASE}/api/v2/platform/module-prices/`, () => HttpResponse.json(prices)),
    http.get(`${BASE}/api/v2/platform/modules/`, () => HttpResponse.json(MODULES)),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPlatformPricingPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminPlatformPricingPage', () => {
  it('lista las tarifas con módulo, ciclo y precio', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('catalogue')).toBeInTheDocument());
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Mensual')).toBeInTheDocument();
    expect(table.getByText('199.00')).toBeInTheDocument();
  });

  it('da de alta una tarifa con POST a module-prices/', async () => {
    let posted = null;
    server.use(
      http.post(`${BASE}/api/v2/platform/module-prices/`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ id: 101, ...posted }, { status: 201 });
      }),
    );
    wrap();
    await waitFor(() => expect(screen.getByText('catalogue')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Nueva tarifa/ }));
    await userEvent.selectOptions(screen.getByLabelText(/Módulo/), '12');
    await userEvent.type(screen.getByLabelText(/Precio/), '99');
    await userEvent.click(screen.getByRole('button', { name: /^Guardar$/ }));
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted).toMatchObject({ module: 12, billing_cycle: 'monthly', price: '99' });
  });

  it('muestra el estado vacío cuando no hay tarifas', async () => {
    wrap([]);
    await waitFor(() =>
      expect(screen.getByText(/Aún no hay tarifas sembradas/)).toBeInTheDocument(),
    );
  });
});
