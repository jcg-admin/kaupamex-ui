/**
 * useAdminProducts — hook de React Query para el listado admin de
 * productos (UC-CAT-09..12).
 *
 * GET /api/v1/admin/products/
 *
 * params soportados (todos opcionales):
 *   page       int   — pagina (1-based)
 *   search     str   — busqueda libre por nombre/SKU
 *   is_active  bool  — filtro por estado activo/inactivo
 *
 * Devuelve el shape { results, count, next, previous }. Si la API
 * responde un arreglo plano, lo normaliza a { results, count }.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const ADMIN_PRODUCTS_URL = '/api/v1/admin/products/';

export const ADMIN_PRODUCTS_KEY = ['admin', 'products'];

export function useAdminProducts(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_PRODUCTS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_PRODUCTS_URL, { params, signal });
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

export default useAdminProducts;
