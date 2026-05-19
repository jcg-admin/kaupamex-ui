/**
 * Tests — AdminAuditLogPage (UC-ADM-03)
 *
 *   GET /api/v1/admin/audit-log/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
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

afterEach(() => jest.clearAllMocks());

describe('AdminAuditLogPage (UC-ADM-03)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: { results: ENTRIES, count: 2 } });
    render(wrap());
    expect(await screen.findByRole('heading', { name: /Auditoria/i })).toBeInTheDocument();
  });

  it('llama al endpoint /api/v1/admin/audit-log/ al montar', async () => {
    apiService.get.mockResolvedValue({ data: { results: ENTRIES, count: 2 } });
    render(wrap());
    await waitFor(() => {
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v1/admin/audit-log/',
        expect.objectContaining({ params: expect.objectContaining({ page: 1 }) }),
      );
    });
  });

  it('lista las entradas de auditoria', async () => {
    apiService.get.mockResolvedValue({ data: { results: ENTRIES, count: 2 } });
    render(wrap());
    expect(await screen.findByText('product.created')).toBeInTheDocument();
    expect(screen.getByText('product.deactivated')).toBeInTheDocument();
  });

  it('aplica el filtro por accion al enviar el formulario', async () => {
    apiService.get.mockResolvedValue({ data: { results: ENTRIES, count: 2 } });
    render(wrap());
    await screen.findByText('product.created');

    fireEvent.change(screen.getByLabelText(/Accion/i),
      { target: { value: 'product.created' } });
    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/audit-log/',
        expect.objectContaining({
          params: expect.objectContaining({ action: 'product.created' }),
        }),
      );
    });
  });
});
