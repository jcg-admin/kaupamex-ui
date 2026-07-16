/**
 * usePlatformProvision — hooks de React Query para la consola L0 del operador
 * Kaupamex (UC-PLT-05, "asignar módulos al tenant").
 *
 * Consume la superficie ya construida en api bajo /api/v2/platform/:
 *   - usePlatformCompanies():          GET  /companies/            (directorio de tenants)
 *   - usePlatformModules():            GET  /modules/              (catálogo L0, ERP families)
 *   - useCompanySubscriptions(id):     GET  /module-subscriptions/?company=<id>
 *
 * Las mutaciones (contratar/dar de baja un módulo) se hacen con apiService
 * directo en la página y luego invalidan la key de suscripciones. Gate: la
 * lectura exige platform.view; la escritura platform.provision (el servidor lo
 * fuerza — el UI sólo pinta lo que el operador puede tocar).
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const PLATFORM_COMPANIES_QUERY_KEY = ['platform-companies'];
export const PLATFORM_MODULES_QUERY_KEY = ['platform-modules'];
export const PLATFORM_SUBSCRIPTIONS_QUERY_KEY = ['platform-subscriptions'];
export const PLATFORM_PRICES_QUERY_KEY = ['platform-module-prices'];

function toList(data) {
  if (data && typeof data === 'object' && 'results' in data) return data.results;
  return Array.isArray(data) ? data : [];
}

export function usePlatformCompanies() {
  return useQuery({
    queryKey: PLATFORM_COMPANIES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/platform/companies/', { signal });
      return toList(data);
    },
  });
}

export function usePlatformModules() {
  return useQuery({
    queryKey: PLATFORM_MODULES_QUERY_KEY,
    // El catálogo L0 cambia poco: cache 5 min para no refetchear al cambiar de
    // tenant en la misma sesión de provisión.
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/platform/modules/', { signal });
      return toList(data);
    },
  });
}

export function useModulePrices() {
  return useQuery({
    queryKey: PLATFORM_PRICES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/platform/module-prices/', { signal });
      return toList(data);
    },
  });
}

export function useCompanySubscriptions(companyId) {
  return useQuery({
    queryKey: [...PLATFORM_SUBSCRIPTIONS_QUERY_KEY, companyId ?? null],
    enabled: companyId != null && companyId !== '',
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/platform/module-subscriptions/', {
        params: { company: companyId },
        signal,
      });
      return toList(data);
    },
  });
}
