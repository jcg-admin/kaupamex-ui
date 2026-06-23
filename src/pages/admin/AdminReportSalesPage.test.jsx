/**
 * Tests — AdminReportSalesPage
 * UC-REP-01: Reporte ejecutivo de ingresos y ventas.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

// El grafico recharts no se ejercita aqui (ResponsiveContainer requiere
// ResizeObserver, ausente en jsdom). Se mockea para asertar el cableado de
// datos; RevenueTrendChart tiene sus propios tests con recharts mockeado.
jest.mock('@components/charts/RevenueTrendChart', () => ({
  __esModule: true,
  default: ({ data }) => (
    <div data-testid="revenue-trend-chart" data-rows={data.length} />
  ),
}));

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

describe('AdminReportSalesPage (UC-REP-01)', () => {
  it('renderiza el titulo del reporte', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    expect(
      await screen.findByRole('heading', { name: /Reporte de ingresos y ventas/i }),
    ).toBeInTheDocument();
  });

  it('muestra los filtros de periodo', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    expect(await screen.findByRole('combobox', { name: /Periodo/i })).toBeInTheDocument();
  });

  it('cambia los parametros al cambiar el periodo', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json(RESPONSE);
      }),
    );
    render(wrap(<AdminReportSalesPage />));
    await screen.findByText(/12500/);
    fireEvent.change(
      screen.getByRole('combobox', { name: /Periodo/i }),
      { target: { value: 'week' } },
    );
    await waitFor(() => {
      expect(lastUrl?.searchParams.get('period')).toBe('week');
    });
  });

  it('renderiza los totales del periodo', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    await screen.findByText(/12500/);
    const totalsPanel = screen.getByLabelText(/Totales del periodo/i);
    expect(totalsPanel).toHaveTextContent('12500.00');
    expect(totalsPanel).toHaveTextContent(/25/);
  });

  it('renderiza la tabla de serie temporal', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    expect(await screen.findByText('2026-05-01')).toBeInTheDocument();
    expect(screen.getByText('2026-05-02')).toBeInTheDocument();
  });

  it('renderiza el grafico de tendencia junto a la tabla de serie', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    const chart = await screen.findByTestId('revenue-trend-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('data-rows', '2');
  });

  it('renderiza el desglose por metodo de pago', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    expect(await screen.findByText('MERCADOPAGO')).toBeInTheDocument();
    expect(screen.getByText('PAYPAL')).toBeInTheDocument();
  });

  it('tiene boton de exportar CSV y PDF', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    expect(await screen.findByRole('link', { name: /Exportar CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Exportar PDF/i })).toBeInTheDocument();
  });

  it('el enlace de exportar lleva el periodo seleccionado', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
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
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () =>
        HttpResponse.json({ totals: { gross_revenue: '0.00', orders: 0 }, series: [], payment_breakdown: [] }),
      ),
    );
    render(wrap(<AdminReportSalesPage />));
    expect(
      await screen.findByText(/Sin datos en el periodo/i),
    ).toBeInTheDocument();
  });

  it('tiene DateRangePicker para filtro de rango de fechas', async () => {
    server.use(
      http.get(`${BASE}/api/v1/admin/reports/sales/`, () => HttpResponse.json(RESPONSE)),
    );
    render(wrap(<AdminReportSalesPage />));
    await screen.findByText(/12500/);
    const dateInputs = screen.getAllByPlaceholderText(/Desde|Hasta/i);
    expect(dateInputs.length).toBeGreaterThanOrEqual(2);
  });
});
