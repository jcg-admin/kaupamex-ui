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

const PRODUCT_REVIEWS_URL = (productId) => `/api/v2/products/${productId}/reviews/`;
const ADMIN_MODERATION_URL = '/api/v2/admin/reviews/?status=PENDING_MODERATION';

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
 * H-CICLO106-02: la API pagina a page_size=50 (H-CICLO90-01). El hook
 * acepta `page` para que AdminReviewsModerationPage pueda navegar entre
 * paginas de la cola. Retorna el objeto paginado completo (results + next).
 */
export function useAdminReviewsModeration(page = 1) {
  return useQuery({
    queryKey: [...ADMIN_REVIEWS_MOD_KEY, page],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_MODERATION_URL, {
        params: { page },
        signal,
      });
      if (data && typeof data === 'object' && 'results' in data) return data;
      return { results: Array.isArray(data) ? data : [], count: 0, next: null, previous: null };
    },
  });
}

export default useProductReviews;
