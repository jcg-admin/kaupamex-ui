/**
 * useSearchHistory — UC-SRCH-03.
 *
 * Lectura via React Query del historial de busquedas del comprador
 * autenticado (maximo 20 terminos, ordenados por -searched_at).
 * Las mutaciones (eliminar uno, borrar todo) viven en searchHistorySlice
 * para preservar lastAction.
 *
 * Endpoint esperado:
 *   GET /api/v1/search/history/ → { results: SearchHistory[], count }
 *   donde SearchHistory = { id, term, searched_at }.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const HISTORY_URL = '/api/v1/search/history/';
export const SEARCH_HISTORY_KEY = ['search', 'history'];

export function useSearchHistory(options = {}) {
  return useQuery({
    queryKey: SEARCH_HISTORY_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(HISTORY_URL, { signal });
      const results = data?.results ?? data ?? [];
      return {
        results: Array.isArray(results) ? results : [],
        count:   data?.count ?? (Array.isArray(results) ? results.length : 0),
      };
    },
    ...options,
  });
}

export default useSearchHistory;
