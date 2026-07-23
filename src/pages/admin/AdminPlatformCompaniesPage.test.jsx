/**
 * Tests AdminPlatformCompaniesPage — directorio de empresas L0 (UC-PLT-12).
 *
 * Verifica que la página:
 *   - lista las companies con estado (Badge), conteo de módulos y usuarios,
 *   - filtra por estado,
 *   - enlaza cada fila a "Provisionar" con ?company=<id>.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import AdminPlatformCompaniesPage from './AdminPlatformCompaniesPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const COMPANIES = [
  { id: 1, code: 'practicayoruba', name: 'PracticaYoruba', status: 'active', active_modules: ['catalogue', 'pos', 'inventory'], user_count: 12, created_at: '2026-01-10T00:00:00Z' },
  { id: 2, code: 'tiendamexico', name: 'Tienda México', status: 'trial', active_modules: ['catalogue'], user_count: 2, created_at: '2026-07-01T00:00:00Z' },
  { id: 3, code: 'zapateria-uno', name: 'Zapatería UNO', status: 'suspended', active_modules: ['catalogue', 'pos'], user_count: 5, created_at: '2026-03-22T00:00:00Z' },
];

function wrap(companies = COMPANIES) {
  server.use(
    http.get(`${BASE}/api/v2/platform/companies/`, () => HttpResponse.json(companies)),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminPlatformCompaniesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminPlatformCompaniesPage', () => {
  it('lista las empresas con estado y enlaza a Provisionar con ?company', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('PracticaYoruba')).toBeInTheDocument());
    // Badge de estado por texto (no solo color) — dentro de la tabla, para no
    // colisionar con las etiquetas del filtro de estado.
    const table = within(screen.getByRole('table'));
    expect(table.getByText('Activo')).toBeInTheDocument();
    expect(table.getByText('Trial')).toBeInTheDocument();
    expect(table.getByText('Suspendido')).toBeInTheDocument();
    // El enlace Provisionar de la primera fila apunta al empresa por id.
    const links = screen.getAllByRole('link', { name: 'Provisionar' });
    expect(links[0]).toHaveAttribute('href', '/admin/platform/provision?company=1');
  });

  it('filtra por estado', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('PracticaYoruba')).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'suspended');
    await waitFor(() => expect(screen.queryByText('PracticaYoruba')).not.toBeInTheDocument());
    expect(screen.getByText('Zapatería UNO')).toBeInTheDocument();
  });

  it('muestra el estado vacío cuando no hay empresas', async () => {
    wrap([]);
    await waitFor(() =>
      expect(screen.getByText(/Aún no hay empresas/)).toBeInTheDocument(),
    );
  });

  it('da de alta una empresa con POST a companies/', async () => {
    let posted = null;
    server.use(
      http.post(`${BASE}/api/v2/platform/companies/`, async ({ request }) => {
        posted = await request.json();
        return HttpResponse.json({ id: 9, ...posted, status: 'trial' }, { status: 201 });
      }),
    );
    wrap();
    await waitFor(() => expect(screen.getByText('PracticaYoruba')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Nueva empresa/ }));
    await userEvent.type(screen.getByLabelText(/Código/), 'zapateria-dos');
    await userEvent.type(screen.getByLabelText(/Nombre/), 'Zapatería DOS');
    await userEvent.click(screen.getByRole('button', { name: /Crear empresa/ }));
    await waitFor(() => expect(posted).not.toBeNull());
    expect(posted).toMatchObject({ code: 'zapateria-dos', name: 'Zapatería DOS' });
  });

  it('suspende una empresa activa con POST a suspend/', async () => {
    let suspended = false;
    server.use(
      http.post(`${BASE}/api/v2/platform/companies/1/suspend/`, () => {
        suspended = true;
        return HttpResponse.json({ id: 1, status: 'suspended' });
      }),
    );
    wrap();
    await waitFor(() => expect(screen.getByText('PracticaYoruba')).toBeInTheDocument());
    // La fila activa ofrece "Suspender"; la suspendida ofrece "Reactivar".
    const suspendBtns = screen.getAllByRole('button', { name: 'Suspender' });
    await userEvent.click(suspendBtns[0]);
    await waitFor(() => expect(suspended).toBe(true));
    expect(screen.getByRole('button', { name: 'Reactivar' })).toBeInTheDocument();
  });
});
