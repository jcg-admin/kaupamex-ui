/**
 * Tests AdminPlatformProvisionPage — consola L0 del operador Kaupamex (UC-PLT-05).
 *
 * Verifica que la página:
 *   - lista los tenants (companies) en el selector,
 *   - al elegir un tenant, pinta los módulos contratables (is_application)
 *     agrupados por category, con Switch on/off reflejando las suscripciones,
 *   - al encender un módulo y Guardar, hace POST a /module-subscriptions/ con
 *     company + module + status active.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import AdminPlatformProvisionPage from './AdminPlatformProvisionPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const COMPANIES = [
  { id: 1, code: 'practicayoruba', name: 'Zapatería UNO', status: 'active', active_modules: ['catalogue'], user_count: 3 },
];
const MODULES = [
  { id: 10, code: 'catalogue', name: 'Ecommerce', is_application: true, tier: 'free', category: 'Order Management', version: '1.0', description: '', depends: [], is_active: true },
  { id: 11, code: 'pos', name: 'Punto de venta', is_application: true, tier: 'free', category: 'Order Management', version: '1.0', description: '', depends: ['catalogue'], is_active: true },
  { id: 12, code: 'inventory', name: 'Inventario', is_application: true, tier: 'free', category: 'Supply Chain Management', version: '1.0', description: '', depends: [], is_active: true },
  { id: 99, code: 'platform', name: 'Plataforma', is_application: false, tier: 'free', category: 'Platform', version: '1.0', description: '', depends: [], is_active: true },
];
const SUBS = [
  { id: 500, company: 1, company_code: 'practicayoruba', module: 10, module_code: 'catalogue', status: 'active', started_at: null, expires_at: null, billing_cycle: 'monthly', price: null, is_active: true, created_at: null },
];

function wrap() {
  server.use(
    http.get(`${BASE}/api/v2/platform/companies/`, () => HttpResponse.json(COMPANIES)),
    http.get(`${BASE}/api/v2/platform/modules/`, () => HttpResponse.json(MODULES)),
    http.get(`${BASE}/api/v2/platform/module-subscriptions/`, () => HttpResponse.json(SUBS)),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPlatformProvisionPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminPlatformProvisionPage', () => {
  it('lista los tenants y, al elegir uno, pinta los módulos por familia', async () => {
    wrap();
    // El selector de empresa se pobló con el tenant.
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Zapatería UNO/ })).toBeInTheDocument(),
    );
    await userEvent.selectOptions(screen.getByLabelText('Empresa'), '1');

    // Módulos contratables (is_application) aparecen; el técnico (platform) no.
    await waitFor(() => expect(screen.getByText('Ecommerce')).toBeInTheDocument());
    expect(screen.getByText('Punto de venta')).toBeInTheDocument();
    expect(screen.getByText('Inventario')).toBeInTheDocument();
    expect(screen.queryByText('Plataforma')).not.toBeInTheDocument();

    // Agrupados por category (familia ERP).
    expect(screen.getByRole('heading', { name: 'Order Management' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Supply Chain Management' })).toBeInTheDocument();

    // El módulo con suscripción activa (catalogue) está encendido.
    expect(screen.getByRole('switch', { name: 'Ecommerce' })).toBeChecked();
    // Uno sin suscripción está apagado.
    expect(screen.getByRole('switch', { name: 'Inventario' })).not.toBeChecked();
  });

  it('al encender un módulo y Guardar hace POST con company + module + status', async () => {
    let posted = null;
    server.use(
      http.post(`${BASE}/api/v2/platform/module-subscriptions/`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ id: 501, ...posted }, { status: 201 });
      }),
    );
    wrap();
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Zapatería UNO/ })).toBeInTheDocument(),
    );
    await userEvent.selectOptions(screen.getByLabelText('Empresa'), '1');
    await waitFor(() => expect(screen.getByText('Inventario')).toBeInTheDocument());

    // Encender Inventario (sin suscripción previa) y guardar.
    await userEvent.click(screen.getByRole('switch', { name: 'Inventario' }));
    await userEvent.click(screen.getByRole('button', { name: /Guardar provisión/ }));

    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted).toMatchObject({ company: '1', module: 12, status: 'active' });
  });
});
