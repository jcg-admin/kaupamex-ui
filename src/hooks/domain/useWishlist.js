/**
 * useWishlist — hook React Query.
 *
 *   UC-WISH-02 — Lista de deseos del comprador autenticado.
 *
 * Las mutaciones (agregar / eliminar / mover al carrito) siguen en el
 * slice `wishlistSlice` para preservar `lastAction`. Este hook cubre
 * solo la lectura con cache compartido entre montajes.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const WISHLIST_URL = '/api/v1/wishlist/';

export const WISHLIST_KEY = ['wishlist'];

/**
 * UC-WISH-02: lista los WishlistItem del comprador.
 *
 * @param {Object} [params] filtros opcionales (page, availability)
 * @param {Object} [options] enabled, etc.
 */
export function useWishlist(params = {}, options = {}) {
  return useQuery({
    queryKey: [...WISHLIST_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(WISHLIST_URL, { params, signal });
      const results = data?.results ?? data?.items ?? data ?? [];
      return {
        items:           Array.isArray(results) ? results : [],
        total_items:     data?.total_items     ?? results?.length ?? 0,
        items_out_of_stock: data?.items_out_of_stock ?? 0,
        pagination:      data?.pagination ?? null,
      };
    },
    ...options,
  });
}

export default useWishlist;
