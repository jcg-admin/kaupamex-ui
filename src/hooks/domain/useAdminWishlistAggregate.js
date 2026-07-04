/**
 * useAdminWishlistAggregate — hook React Query.
 *
 *   UC-WISH-04 (H-08) — Agregado de wishlist para marketing (admin).
 *
 * Lee GET /api/v2/admin/wishlist/aggregate/: por producto, cuántas veces está
 * en listas de deseos y cuántos usuarios distintos lo desean. Solo agregados
 * anónimos (BR-013).
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const URL = '/api/v2/admin/wishlist/aggregate/';

export const ADMIN_WISHLIST_AGG_KEY = ['admin', 'wishlist', 'aggregate'];

export function useAdminWishlistAggregate(options = {}) {
  return useQuery({
    queryKey: ADMIN_WISHLIST_AGG_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get(URL, { signal });
      const results = Array.isArray(data?.results) ? data.results : [];
      return { results, count: data?.count ?? results.length };
    },
    ...options,
  });
}

export default useAdminWishlistAggregate;
