/**
 * Tests AdminDashboardPage — landing del panel admin.
 *
 * Verifica:
 *   - renderiza titulo y subtitulo
 *   - muestra KPIs alimentados por useAdminDashboard (UC-ORD-10)
 *   - tolera error de carga sin romper navegacion (muestra "—")
 *   - expone accesos rapidos a las secciones criticas
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import AdminDashboardPage from './AdminDashboardPage';

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

afterEach(() => jest.clearAllMocks());

describe('AdminDashboardPage — landing admin', () => {
  it('renderiza titulo y subtitulo del panel', async () => {
    apiService.get.mockResolvedValueOnce({ data: {} });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /panel de administracion/i }),
    ).toBeInTheDocument();
  });

  it('muestra KPIs cuando el endpoint responde con datos', async () => {
    apiService.get.mockResolvedValueOnce({
      data: {
        order_counts: { PENDING: 70, PROCESSING: 31 },
        day_summary:  { revenue: 12345, approved_count: 9 },
        expiring_orders: [{ id: 1 }, { id: 2 }],
        support_open: 8,
        returns_new:  6,
        low_stock_count: 11,
      },
    });
    renderPage();
    expect(await screen.findByText('70')).toBeInTheDocument();
    expect(screen.getByText('31')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();  // support_open
    expect(screen.getByText('6')).toBeInTheDocument();  // returns_new
    expect(screen.getByText('11')).toBeInTheDocument(); // low stock
    expect(screen.getByText(/\$12,345\.00/)).toBeInTheDocument();
  });

  it('tolera error de carga del dashboard', async () => {
    apiService.get.mockRejectedValueOnce(new Error('boom'));
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/no se pudo cargar/i),
    );
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('lista accesos rapidos a las secciones criticas', async () => {
    apiService.get.mockResolvedValueOnce({ data: {} });
    renderPage();
    expect(
      await screen.findByRole('link', { name: /productos/i }),
    ).toHaveAttribute('href', '/admin/products');
    expect(screen.getByRole('link', { name: /^cupones$/i }))
      .toHaveAttribute('href', '/admin/vouchers');
    expect(screen.getByRole('link', { name: /^inventario$/i }))
      .toHaveAttribute('href', '/admin/inventory');
  });
});
