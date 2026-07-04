/**
 * useShippingZones — hook de React Query para el catálogo de zonas de envío
 * + tiempos de entrega (H-12). Lee /api/v2/admin/shipping-zones/.
 *
 * Las mutaciones (crear/editar/desactivar) se hacen con apiService directo en
 * la página y luego invalidan SHIPPING_ZONES_QUERY_KEY para refrescar el cache.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const SHIPPING_ZONES_QUERY_KEY = ['admin-shipping-zones'];

export function useShippingZones(params = {}) {
  return useQuery({
    queryKey: [...SHIPPING_ZONES_QUERY_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/admin/shipping-zones/', { params, signal });
      if (data && typeof data === 'object' && 'results' in data) return data.results;
      return Array.isArray(data) ? data : [];
    },
  });
}

export default useShippingZones;
