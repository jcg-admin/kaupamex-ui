/**
 * useReviews — hooks de React Query para resenas de productos.
 *
 *   UC-REV-02 — Listado publico de resenas aprobadas de un producto
 *   UC-REV-03 — Cola admin de resenas pendientes de moderacion
 *
 * Las mutaciones (crear UC-REV-01 / aprobar-rechazar UC-REV-03) viven
 * en `reviewsSlice` para preservar `lastAction`. Este modulo cubre
 * solo lecturas via React Query con cache compartido.
 *
 * English identifiers + English JSON keys (DEC-DOC-005). No se silencian
 * errores: cada catch propaga via React Query `isError` (DEC-DOC-008).
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const PRODUCT_REVIEWS_URL = (productId) => `/api/v1/products/${productId}/reviews/`;
const ADMIN_MODERATION_URL = '/api/v1/admin/reviews/?status=PENDING_MODERATION';

export const PRODUCT_REVIEWS_KEY = ['reviews', 'product'];
export const ADMIN_REVIEWS_MOD_KEY = ['reviews', 'admin', 'moderation'];

/**
 * UC-REV-02: lista resenas aprobadas del producto con calificacion
 * promedio y desglose por estrellas.
 */
export function useProductReviews(productId, params = {}) {
  return useQuery({
    queryKey: [...PRODUCT_REVIEWS_KEY, productId, params],
    enabled:  Boolean(productId),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(PRODUCT_REVIEWS_URL(productId), {
        params,
        signal,
      });
      const results = data?.results ?? (Array.isArray(data) ? data : []);
      return {
        items:           Array.isArray(results) ? results : [],
        average_rating:  data?.average_rating ?? null,
        total_reviews:   data?.total_reviews ?? results?.length ?? 0,
        rating_breakdown: data?.rating_breakdown ?? null,
      };
    },
  });
}

/**
 * UC-REV-03: cola admin de resenas en estado PENDING_MODERATION.
 */
export function useAdminReviewsModeration() {
  return useQuery({
    queryKey: ADMIN_REVIEWS_MOD_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_MODERATION_URL, { signal });
      return data?.results ?? (Array.isArray(data) ? data : []);
    },
  });
}

export default useProductReviews;
