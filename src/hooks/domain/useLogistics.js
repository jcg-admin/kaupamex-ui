/**
 * useLogistics — UC-LOG-08
 *
 * GET /api/v1/logistics/
 *
 * Devuelve los dos grupos de trabajo del panel de envios:
 *   - pending_pickup: ordenes en PAGO_CONFIRMADO / EN_PREPARACION sin
 *     guia (group A — listo para crear guia).
 *   - in_transit: ShipmentGuide activas no entregadas con su ultimo
 *     evento (group B — en transito).
 *
 * T-120 D-04 (alinear-ui-logistics-dashboard-fields): keys del payload
 * son `pending_pickup` / `in_transit` (labels semanticas del UC), NO
 * `group_a`/`group_b`. Antes la UI leia keys inexistentes -> panel
 * admin siempre vacio en produccion.
 *
 * Identificadores y campos en ingles (DEC-DOC-005). El filtro opcional
 * por courier va como ?courier_id=.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v2/logistics/';
export const LOGISTICS_KEY = ['admin', 'logistics'];

export function useLogistics(params = {}) {
  return useQuery({
    queryKey: [...LOGISTICS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(URL, { params, signal });
      return {
        // Backend devuelve listas en `pending_pickup` y `in_transit`.
        // Exponemos ambos nombres (canon API + alias group_* para
        // retrocompat con consumidores existentes que aun los usen).
        pending_pickup: data?.pending_pickup ?? [],
        in_transit:     data?.in_transit ?? [],
        group_a:        data?.pending_pickup ?? [],
        group_b:        data?.in_transit ?? [],
        group_a_count:  data?.group_a_count ?? 0,
        group_b_count:  data?.group_b_count ?? 0,
      };
    },
  });
}

export default useLogistics;
