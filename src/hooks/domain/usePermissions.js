/**
 * usePermissions — UC-ADM-02
 *
 * GET /api/v1/admin/permissions/   (lista de roles + permisos disponibles)
 *
 * Devuelve { roles: [{ role, permissions: [...] }], permissions: [...] }.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v1/admin/permissions/';
export const PERMISSIONS_KEY = ['admin', 'permissions'];

export function usePermissions() {
  return useQuery({
    queryKey: PERMISSIONS_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(URL, { signal });
      return {
        roles:       data?.roles       ?? [],
        permissions: data?.permissions ?? [],
      };
    },
  });
}

export default usePermissions;
