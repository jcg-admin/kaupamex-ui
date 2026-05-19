/**
 * useBackups — UC-ADM-05
 *
 * GET /api/v1/admin/backups/
 *
 * Devuelve la lista de backups generados (cron + manuales).
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v1/admin/backups/';
export const BACKUPS_KEY = ['admin', 'backups'];

export function useBackups(params = {}) {
  return useQuery({
    queryKey: [...BACKUPS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(URL, { params, signal });
      if (Array.isArray(data)) {
        return { results: data, count: data.length };
      }
      return {
        results: data?.results ?? [],
        count:   data?.count   ?? 0,
      };
    },
  });
}

export default useBackups;
