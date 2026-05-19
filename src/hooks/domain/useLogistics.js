/**
 * useLogistics — UC-LOG-08
 *
 * GET /api/v1/logistics/
 *
 * Devuelve los dos grupos de trabajo del panel de envios:
 *   - group_a: ordenes en PAGO_CONFIRMADO / EN_PREPARACION sin guia
 *   - group_b: ShipmentGuide activas no entregadas con su ultimo evento
 *
 * Identificadores y campos en ingles (DEC-DOC-005). El filtro opcional
 * por courier va como ?courier_id=.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v1/logistics/';
export const LOGISTICS_KEY = ['admin', 'logistics'];

export function useLogistics(params = {}) {
  return useQuery({
    queryKey: [...LOGISTICS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(URL, { params, signal });
      return {
        group_a: data?.group_a ?? [],
        group_b: data?.group_b ?? [],
      };
    },
  });
}

export default useLogistics;
