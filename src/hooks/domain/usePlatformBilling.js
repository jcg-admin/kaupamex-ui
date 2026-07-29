/**
 * usePlatformBilling — hooks de React Query para la consola de facturación L0
 * del operador Kaupamex (UC-PLT-18 §7C, "cobro por lo suscrito").
 *
 * Consume la superficie slice-3 ya construida en api bajo /api/v2/platform/:
 *   - usePlatformBillingRuns():     GET  /billing/runs/            (corridas, platform.view)
 *   - useCompanyInvoices(id):       GET  /companies/<id>/invoices/ (facturas de la empresa)
 *
 * Las mutaciones (ejecutar corrida, reintentar factura) se hacen con apiService
 * directo en la página y luego invalidan estas keys. Gate: la lectura exige
 * platform.view; la escritura platform.billing (el servidor lo fuerza — el UI
 * sólo pinta lo que el operador puede tocar).
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const PLATFORM_BILLING_RUNS_QUERY_KEY = ['platform-billing-runs'];
export const PLATFORM_INVOICES_QUERY_KEY = ['platform-invoices'];

function toList(data) {
  if (data && typeof data === 'object' && 'results' in data) return data.results;
  return Array.isArray(data) ? data : [];
}

export function usePlatformBillingRuns() {
  return useQuery({
    queryKey: PLATFORM_BILLING_RUNS_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/platform/billing/runs/', { signal });
      return toList(data);
    },
  });
}

export function useCompanyInvoices(companyId) {
  return useQuery({
    queryKey: [...PLATFORM_INVOICES_QUERY_KEY, companyId],
    // Sin empresa elegida no hay a quién pedir facturas.
    enabled: Boolean(companyId),
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get(
        `/api/v2/platform/companies/${companyId}/invoices/`, { signal },
      );
      return toList(data);
    },
  });
}
