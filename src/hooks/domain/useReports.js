/**
 * useReports — hooks de React Query para los reportes admin.
 *
 *   UC-REP-01 — Reporte de ingresos y ventas
 *   UC-REP-02 — Reporte top sellers (productos mas vendidos)
 *   UC-REP-03 — Dashboard analitico
 *   UC-REP-04 — Reporte de clientes (RFM)
 *   UC-REP-05 — Exportar (CSV/PDF) via URL de descarga
 *
 * Los reportes son de lectura; los filtros viven en el estado local de
 * la pagina y se envian como query params (English keys). La exportacion
 * se resuelve construyendo una URL que el navegador descarga directo.
 */

import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const BASE = '/api/v1/admin/reports';

export const REPORTS_KEY = ['admin', 'reports'];

const REPORT_PATHS = {
  sales:         `${BASE}/sales/`,
  'top-sellers': `${BASE}/top-sellers/`,
  'customers-rfm': `${BASE}/customers-rfm/`,
  dashboard:     `${BASE}/dashboard/`,
};

function useReportQuery(reportSlug, params) {
  const path = REPORT_PATHS[reportSlug];
  return useQuery({
    queryKey: [...REPORTS_KEY, reportSlug, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(path, { params, signal });
      return data ?? {};
    },
  });
}

export function useSalesReport(params = {}) {
  return useReportQuery('sales', params);
}

export function useTopSellersReport(params = {}) {
  return useReportQuery('top-sellers', params);
}

export function useCustomersRfmReport(params = {}) {
  return useReportQuery('customers-rfm', params);
}

export function useAnalyticsDashboard(params = {}) {
  return useReportQuery('dashboard', params);
}

/**
 * Construye la URL de exportacion (UC-REP-05). El navegador la abre
 * directamente y el backend devuelve el blob con Content-Disposition.
 *
 *   buildReportExportUrl('sales', { period: 'month', format: 'csv' })
 *     -> '/api/v1/admin/reports/sales/export/?period=month&format=csv'
 */
export function buildReportExportUrl(reportSlug, params = {}) {
  const base = REPORT_PATHS[reportSlug];
  if (!base) throw new Error(`Reporte desconocido: ${reportSlug}`);
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === null || v === undefined || v === '') return;
    search.set(k, v);
  });
  const qs = search.toString();
  return `${base}export/${qs ? `?${qs}` : ''}`;
}

export default useSalesReport;
