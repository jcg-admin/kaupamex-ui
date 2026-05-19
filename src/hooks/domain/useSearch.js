/**
 * useSearch — UC-CAT-03 + UC-CAT-03-EXT + UC-SRCH-01.
 *
 * Lectura via React Query de los resultados de busqueda full-text del
 * catalogo. Combinable con filtros (UC-CAT-03-EXT) y paginacion.
 *
 * Endpoint esperado:
 *   GET /api/v1/catalogue/search/?q=<term>&category=<slug>
 *                                  &price_min=&price_max=&page=
 *   → { results, count, next, previous, active_filters, normalized_query }
 *
 * El termino se sanitiza en el cliente (longitud minima 2, trim, colapso
 * de espacios) — UC-CAT-03 Alt C / Alt D.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const SEARCH_URL = '/api/v1/catalogue/search/';
export const SEARCH_KEY = ['catalog', 'search'];

const MIN_LENGTH = 2;

export function normalizeQuery(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\s+/g, ' ');
}

export function isQueryValid(q) {
  return normalizeQuery(q).length >= MIN_LENGTH;
}

export function useSearch(params = {}, options = {}) {
  const { q, ...rest } = params;
  const normalized = normalizeQuery(q ?? '');
  const enabled = (options.enabled ?? true) && normalized.length >= MIN_LENGTH;

  return useQuery({
    queryKey: [...SEARCH_KEY, normalized, rest],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(SEARCH_URL, {
        params: { q: normalized, ...rest },
        signal,
      });
      return {
        results:           data?.results ?? [],
        count:             data?.count ?? 0,
        active_filters:    data?.active_filters ?? {},
        normalized_query:  data?.normalized_query ?? normalized,
        next:              data?.next ?? null,
        previous:          data?.previous ?? null,
      };
    },
    enabled,
    keepPreviousData: true,
    ...options,
  });
}

export default useSearch;
