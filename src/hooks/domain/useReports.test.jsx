/**
 * Tests — useReports (React Query)
 *
 *   UC-REP-01 — Reporte de ingresos y ventas
 *   UC-REP-02 — Reporte top sellers
 *   UC-REP-03 — Dashboard analitico
 *   UC-REP-04 — Reporte de clientes RFM
 *   UC-REP-05 — Exportar reporte (CSV/PDF)
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import {
  useSalesReport,
  useTopSellersReport,
  useCustomersRfmReport,
  useAnalyticsDashboard,
  buildReportExportUrl,
} from './useReports';

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

afterEach(() => jest.clearAllMocks());

describe('useReports hooks', () => {
  it('useSalesReport solicita el reporte de ventas con filtros', async () => {
    apiService.get.mockResolvedValue({
      data: { totals: { gross_revenue: '1000.00', orders: 12 }, series: [] },
    });
    const { result } = renderHook(
      () => useSalesReport({ period: 'month' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/reports/sales/',
      expect.objectContaining({ params: { period: 'month' } }),
    );
    expect(result.current.data.totals.orders).toBe(12);
  });

  it('useTopSellersReport retorna el ranking', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ product_id: 1, units: 50, revenue: '500.00' }] },
    });
    const { result } = renderHook(
      () => useTopSellersReport({ period: 'week', limit: 10 }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/reports/top-sellers/',
      expect.objectContaining({ params: { period: 'week', limit: 10 } }),
    );
    expect(result.current.data.results).toHaveLength(1);
  });

  it('useCustomersRfmReport retorna la lista segmentada', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [{ customer_id: 7, segment: 'VIP', recency: 3, frequency: 8, monetary: '900.00' }] },
    });
    const { result } = renderHook(
      () => useCustomersRfmReport({ segment: 'VIP' }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/reports/customers-rfm/',
      expect.objectContaining({ params: { segment: 'VIP' } }),
    );
    expect(result.current.data.results[0].segment).toBe('VIP');
  });

  it('useAnalyticsDashboard agrega KPIs del dashboard', async () => {
    apiService.get.mockResolvedValue({
      data: {
        today: { revenue: '300.00', orders: 4, new_customers: 1 },
        trend: [],
        top_products: [],
        open_tickets: 2,
        low_stock_alerts: 1,
      },
    });
    const { result } = renderHook(() => useAnalyticsDashboard(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/reports/dashboard/',
      expect.objectContaining({ params: {} }),
    );
    expect(result.current.data.today.orders).toBe(4);
  });

  it('buildReportExportUrl produce la URL con filtros y formato', () => {
    const url = buildReportExportUrl('sales', { period: 'month', format: 'csv' });
    expect(url).toBe('/api/v1/admin/reports/sales/export/?period=month&format=csv');
  });

  it('buildReportExportUrl omite valores nulos/vacios', () => {
    const url = buildReportExportUrl('top-sellers', { period: '', limit: 10, format: 'pdf' });
    expect(url).toBe('/api/v1/admin/reports/top-sellers/export/?limit=10&format=pdf');
  });
});
