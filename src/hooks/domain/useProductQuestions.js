/**
 * useProductQuestions — hooks de React Query para preguntas de producto.
 *
 *   UC-QST-02 — Listado publico (preguntas con respuesta aprobada)
 *   UC-QST-03 — Cola admin (pendientes de responder)
 *   UC-QST-04 — Cola admin (pendientes de moderacion)
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const PUBLIC_LIST_URL          = (productId) => `/api/v1/products/${productId}/questions/`;
const ADMIN_PENDING_ANSWER_URL = '/api/v1/admin/questions/?status=APPROVED_PENDING_ANSWER';
const ADMIN_MODERATION_URL     = '/api/v1/admin/questions/?status=PENDING_MODERATION';

export const PRODUCT_QUESTIONS_KEY      = ['questions', 'product'];
export const ADMIN_QUESTIONS_ANSWER_KEY = ['questions', 'admin', 'pending-answer'];
export const ADMIN_QUESTIONS_MOD_KEY    = ['questions', 'admin', 'moderation'];

export function useProductQuestions(productId, params = {}) {
  return useQuery({
    queryKey: [...PRODUCT_QUESTIONS_KEY, productId, params],
    enabled:  Boolean(productId),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(PUBLIC_LIST_URL(productId), {
        params,
        signal,
      });
      return data?.results ?? (Array.isArray(data) ? data : []);
    },
  });
}

export function useAdminQuestionsPendingAnswer() {
  return useQuery({
    queryKey: ADMIN_QUESTIONS_ANSWER_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_PENDING_ANSWER_URL, { signal });
      return data?.results ?? (Array.isArray(data) ? data : []);
    },
  });
}

export function useAdminQuestionsModeration() {
  return useQuery({
    queryKey: ADMIN_QUESTIONS_MOD_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_MODERATION_URL, { signal });
      return data?.results ?? (Array.isArray(data) ? data : []);
    },
  });
}

export default useProductQuestions;
