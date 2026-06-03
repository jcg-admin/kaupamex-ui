/**
 * Tests — AdminReportSalesPage
 * UC-REP-01: Reporte ejecutivo de ingresos y ventas.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

// El grafico recharts no se ejercita aqui (ResponsiveContainer requiere
// ResizeObserver, ausente en jsdom). Se mockea para asertar el cableado de
// datos; RevenueTrendChart tiene sus propios tests con recharts mockeado.
jest.mock('@components/charts/RevenueTrendChart', () => ({
  __esModule: true,
  default: ({ data }) => (
    <div data-testid="revenue-trend-chart" data-rows={data.length} />
  ),
}));

import apiService from '@services/apiService';
import AdminReportSalesPage from './AdminReportSalesPage';

const RESPONSE = {
  totals: {
    revenue:        '12500.00',
    net_revenue:    '11800.00',
    orders:         25,
    average_ticket: '500.00',
  },
  comparison: { revenue_delta_pct: 12.5 },
  series:     [
    { date: '2026-05-01', revenue: '1000.00', orders: 3 },
    { date: '2026-05-02', revenue: '1500.00', orders: 4 },
  ],
  payment_breakdown: [
    { gateway: 'MERCADOPAGO', amount: '8000.00', count: 18 },
    { gateway: 'PAYPAL',      amount: '4500.00', count: 7  },
  ],
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

describe('AdminReportSalesPage (UC-REP-01)', () => {
  it('renderiza el titulo del reporte', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    expect(
      await screen.findByRole('heading', { name: /Reporte de ingresos y ventas/i }),
    ).toBeInTheDocument();
  });

  it('muestra los filtros de periodo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    expect(await screen.findByRole('combobox', { name: /Periodo/i })).toBeInTheDocument();
  });

  it('cambia los parametros al cambiar el periodo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    await screen.findByText(/12500/);
    fireEvent.change(
      screen.getByRole('combobox', { name: /Periodo/i }),
      { target: { value: 'week' } },
    );
    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/reports/sales/',
        expect.objectContaining({ params: { period: 'week' } }),
      );
    });
  });

  it('renderiza los totales del periodo', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    await screen.findByText(/12500/);
    const totalsPanel = screen.getByLabelText(/Totales del periodo/i);
    expect(totalsPanel).toHaveTextContent('12500.00');
    expect(totalsPanel).toHaveTextContent(/25/);
  });

  it('renderiza la tabla de serie temporal', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    // series rows use the `date` field from the response
    expect(await screen.findByText('2026-05-01')).toBeInTheDocument();
    expect(screen.getByText('2026-05-02')).toBeInTheDocument();
  });

  it('renderiza el grafico de tendencia junto a la tabla de serie', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    const chart = await screen.findByTestId('revenue-trend-chart');
    expect(chart).toBeInTheDocument();
    // El grafico recibe las mismas filas que la tabla.
    expect(chart).toHaveAttribute('data-rows', '2');
  });

  it('renderiza el desglose por metodo de pago', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    // payment_breakdown rows use the `gateway` field from the response
    expect(await screen.findByText('MERCADOPAGO')).toBeInTheDocument();
    expect(screen.getByText('PAYPAL')).toBeInTheDocument();
  });

  it('tiene boton de exportar CSV y PDF', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    expect(await screen.findByRole('link', { name: /Exportar CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exportar PDF/i })).toBeInTheDocument();
  });

  it('el enlace de exportar lleva el periodo seleccionado', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE });
    render(wrap(<AdminReportSalesPage />));
    await screen.findByText(/12500/);
    fireEvent.change(
      screen.getByRole('combobox', { name: /Periodo/i }),
      { target: { value: 'year' } },
    );
    await waitFor(() => {
      const csvLink = screen.getByRole('link', { name: /Exportar CSV/i });
      expect(csvLink).toHaveAttribute(
        'href',
        '/api/v1/admin/reports/sales/export/?period=year&format=csv',
      );
    });
  });

  it('muestra estado vacio cuando no hay serie', async () => {
    apiService.get.mockResolvedValue({
      data: { totals: { gross_revenue: '0.00', orders: 0 }, series: [], payment_breakdown: [] },
    });
    render(wrap(<AdminReportSalesPage />));
    expect(
      await screen.findByText(/Sin datos en el periodo/i),
    ).toBeInTheDocument();
  });
});
