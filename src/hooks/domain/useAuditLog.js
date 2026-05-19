/**
 * useAuditLog — UC-ADM-03
 *
 * GET /api/v1/admin/audit-log/
 *
 * params opcionales: page, actor_id, action, resource_type, from, to.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v1/admin/audit-log/';
export const AUDIT_LOG_KEY = ['admin', 'audit-log'];

export function useAuditLog(params = {}) {
  return useQuery({
    queryKey: [...AUDIT_LOG_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(URL, { params, signal });
      if (Array.isArray(data)) {
        return { results: data, count: data.length, next: null, previous: null };
      }
      return {
        results:  data?.results  ?? [],
        count:    data?.count    ?? 0,
        next:     data?.next     ?? null,
        previous: data?.previous ?? null,
      };
    },
    keepPreviousData: true,
  });
}

export default useAuditLog;
