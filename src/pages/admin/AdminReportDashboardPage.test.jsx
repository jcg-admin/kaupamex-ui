/**
 * Tests — AdminReportDashboardPage
 * UC-REP-03: Dashboard analitico consolidado.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import AdminReportDashboardPage from './AdminReportDashboardPage';

const RESPONSE = {
  today: {
    revenue:        '850.00',
    orders:         9,
    new_customers:  3,
  },
  trend: [
    { bucket: '2026-05-17', revenue: '700.00' },
    { bucket: '2026-05-18', revenue: '800.00' },
  ],
  top_products: [
    { product_id: 1, name: 'Falda Yoruba',   units: 18 },
    { product_id: 2, name: 'Camisa Africana', units: 12 },
  ],
  open_tickets:     4,
  low_stock_alerts: 2,
};

const wrap = (ui) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('AdminReportDashboardPage (UC-REP-03)', () => {
  it('renderiza el titulo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportDashboardPage />));
    expect(
      await screen.findByRole('heading', { name: /Dashboard analítico/i }),
    ).toBeInTheDocument();
  });

  it('muestra los KPIs del dia', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportDashboardPage />));
    await screen.findByText(/850\.00/);
    const todayPanel = screen.getByLabelText(/KPIs del día/i);
    expect(todayPanel).toHaveTextContent(/9/);
    expect(todayPanel).toHaveTextContent(/3/);
  });

  it('muestra el numero de tickets abiertos', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportDashboardPage />));
    await screen.findByText('Falda Yoruba');
    expect(screen.getByText(/Tickets de soporte abiertos/i)).toBeInTheDocument();
    const ops = screen.getByLabelText(/Métricas operativas/i);
    expect(ops).toHaveTextContent('4');
    expect(ops).toHaveTextContent('2');
  });

  it('muestra alertas de stock bajo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportDashboardPage />));
    expect(await screen.findByText(/Alertas de stock bajo/i)).toBeInTheDocument();
  });

  it('renderiza el top 5 productos del mes', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportDashboardPage />));
    expect(await screen.findByText('Falda Yoruba')).toBeInTheDocument();
    expect(screen.getByText('Camisa Africana')).toBeInTheDocument();
  });

  it('tiene accesos directos a los reportes detallados', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportDashboardPage />));
    await screen.findByText('Falda Yoruba');
    expect(screen.getByRole('link', { name: /Ver reporte de ventas/i }))
      .toHaveAttribute('href', '/admin/reports/sales');
    expect(screen.getByRole('link', { name: /Ver top sellers/i }))
      .toHaveAttribute('href', '/admin/reports/top-sellers');
    expect(screen.getByRole('link', { name: /Ver clientes/i }))
      .toHaveAttribute('href', '/admin/reports/customers-rfm');
  });

  it('estado de error si la API falla', async () => {
    apiService.get.mockRejectedValue(new Error('boom'));
    render(wrap(<AdminReportDashboardPage />));
    expect(
      await screen.findByText(/No se pudo cargar el dashboard/i),
    ).toBeInTheDocument();
  });
});
