/**
 * Tests — AdminAuditLogPage (UC-ADM-03)
 *
 *   GET /api/v2/admin/audit-log/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import AdminAuditLogPage from './AdminAuditLogPage';

const ENTRIES = [
  {
    id: 1, timestamp: '2026-05-19T12:00:00Z',
    actor_id: 42, actor_email: 'admin@yoruba.mx',
    action: 'product.created', resource_type: 'product', resource_id: 99,
    correlation_id: 'abc-123',
  },
  {
    id: 2, timestamp: '2026-05-19T13:00:00Z',
    actor_id: 42, actor_email: 'admin@yoruba.mx',
    action: 'product.deactivated', resource_type: 'product', resource_id: 99,
    correlation_id: 'abc-124',
  },
];

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <AdminAuditLogPage />
    </QueryClientProvider>
  );
};

describe('AdminAuditLogPage (UC-ADM-03)', () => {
  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/audit-log/`, () =>
        HttpResponse.json({ results: ENTRIES, count: 2 }),
      ),
    );
    render(wrap());
    expect(await screen.findByRole('heading', { name: /Auditoria/i })).toBeInTheDocument();
  });

  it('llama al endpoint /api/v1/admin/audit-log/ al montar', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/audit-log/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json({ results: ENTRIES, count: 2 });
      }),
    );
    render(wrap());
    await waitFor(() => {
      expect(lastUrl?.searchParams.get('page')).toBe('1');
    });
  });

  it('lista las entradas de auditoria', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/audit-log/`, () =>
        HttpResponse.json({ results: ENTRIES, count: 2 }),
      ),
    );
    render(wrap());
    expect(await screen.findByText('product.created')).toBeInTheDocument();
    expect(screen.getByText('product.deactivated')).toBeInTheDocument();
  });

  it('integra DateRangePicker (B2) en vez de inputs type=date crudos', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/audit-log/`, () =>
        HttpResponse.json({ results: ENTRIES, count: 2 }),
      ),
    );
    const { container } = render(wrap());
    await screen.findByText('product.created');
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(screen.getByPlaceholderText('Desde')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Hasta')).toBeInTheDocument();
  });

  it('aplica el filtro por accion al enviar el formulario', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/audit-log/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json({ results: ENTRIES, count: 2 });
      }),
    );
    render(wrap());
    await screen.findByText('product.created');

    fireEvent.change(screen.getByLabelText(/Accion/i),
      { target: { value: 'product.created' } });
    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));

    await waitFor(() => {
      expect(lastUrl?.searchParams.get('action')).toBe('product.created');
    });
  });
});
