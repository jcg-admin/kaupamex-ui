/**
 * useRelatedProducts — UC-CAT-07.
 *
 * Lectura via React Query de la lista de productos relacionados a un
 * producto dado. La logica de seleccion (misma categoria, productos
 * activos con stock, exclusion del producto actual) vive en el backend.
 *
 * Endpoint esperado: GET /api/v1/products/<slug>/related/
 *   → { results: Product[], fallback: 'category' | 'recent' | 'best_sellers' }
 *
 * Errores: la pagina contenedora oculta la seccion silenciosamente
 * cuando el query falla (UC-CAT-07 EX-01 / EX-02).
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const RELATED_PRODUCTS_KEY = ['catalog', 'related-products'];

export function useRelatedProducts(slug, options = {}) {
  return useQuery({
    queryKey: [...RELATED_PRODUCTS_KEY, slug],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(
        `/api/v1/products/${encodeURIComponent(slug)}/related/`,
        { signal },
      );
      const results = data?.results ?? [];
      return {
        results:  Array.isArray(results) ? results : [],
        fallback: data?.fallback ?? null,
      };
    },
    enabled: Boolean(slug),
    staleTime: 60_000,
    ...options,
  });
}

export default useRelatedProducts;
