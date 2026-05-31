/**
 * useVouchers — hook de React Query para listar vouchers (UC-PRO-02).
 *
 * Sustituye / complementa el thunk `fetchVouchers` para vistas que se
 * benefician del cache de React Query (transiciones instantaneas
 * entre montajes, refetch on-demand, signal de aborto). Coexiste con
 * el slice — las mutaciones (`createVoucher`, `deactivateVoucher`)
 * siguen pasando por Redux porque comparten `lastAction`/`isActioning`
 * con el resto de la UI.
 *
 * Tras una mutacion exitosa se debe invalidar `['vouchers']` para
 * sincronizar el cache.
 */

import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const VOUCHERS_QUERY_KEY = ['vouchers'];

export function useVouchers(params = {}) {
  return useQuery({
    queryKey: [...VOUCHERS_QUERY_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get('/api/v1/admin/vouchers/', {
        params,
        signal,
      });
      // H-CICLO106-01: API ahora pagina (page_size=50). Retornar el objeto
      // completo para que AdminVouchersPage pueda renderizar controles de
      // paginacion usando data.next / data.count.
      if (data && typeof data === 'object' && 'results' in data) return data;
      return { results: Array.isArray(data) ? data : [], count: 0, next: null, previous: null };
    },
  });
}

export default useVouchers;
