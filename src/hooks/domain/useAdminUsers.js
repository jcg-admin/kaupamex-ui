/**
 * useAdminUsers — UC-ADM-01
 *
 * GET /api/v1/admin/users/
 *
 * Soporta filtros opcionales: ?role=, ?is_active=, ?search=, ?page=.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v1/admin/users/';
export const ADMIN_USERS_KEY = ['admin', 'users'];

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_USERS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(URL, { params, signal });
      if (Array.isArray(data)) {
        return { results: data, count: data.length, next: null, previous: null };
      }
      return {
        results:  data?.results ?? [],
        count:    data?.count   ?? 0,
        next:     data?.next    ?? null,
        previous: data?.previous ?? null,
      };
    },
    keepPreviousData: true,
  });
}

export default useAdminUsers;
