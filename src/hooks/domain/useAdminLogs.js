/**
 * useAdminLogs — UC-ADM-06 (SOL-011 T-09)
 *
 * GET /api/v2/admin/logs/  (endpoint DRF read-only, DEC-LOG-08 revisada)
 *
 * params opcionales:
 *   source          requestlog (default) | applog
 *   correlation_id  filtro exacto (une RequestLog/AppLog de una request)
 *   status, status_min, path   (RequestLog)
 *   level                      (AppLog)
 *   from, to        rango created_at (ISO 8601)
 *   page, page_size paginacion
 *
 * El endpoint responde { source, count, page, pages, results }.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v2/admin/logs/';
export const ADMIN_LOGS_KEY = ['admin', 'logs'];

export function useAdminLogs(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_LOGS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(URL, { params, signal });
      return {
        source:  data?.source  ?? 'requestlog',
        results: data?.results ?? [],
        count:   data?.count   ?? 0,
        page:    data?.page    ?? 1,
        pages:   data?.pages   ?? 1,
      };
    },
    keepPreviousData: true,
  });
}

export default useAdminLogs;
