/**
 * useCategories — hooks de React Query para el arbol de categorias.
 *
 *   useCategories()          GET    /api/v1/categories/        (listado publico/admin)
 *   useAdminCategories()     GET    /api/v1/admin/categories/  (incluye inactivas)
 *
 * Las mutaciones (crear / editar / desactivar) viven en categoriesSlice
 * para usar el patron canonico con serializeApiError. UC-CAT-06.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const PUBLIC_URL = '/api/v1/categories/';
const ADMIN_URL  = '/api/v1/admin/categories/';

export const CATEGORIES_KEY       = ['categories'];
export const ADMIN_CATEGORIES_KEY = ['admin', 'categories'];

function normalize(data) {
  if (Array.isArray(data)) {
    return { results: data, count: data.length };
  }
  return {
    results: data?.results ?? [],
    count:   data?.count   ?? 0,
  };
}

export function useCategories(params = {}) {
  return useQuery({
    queryKey: [...CATEGORIES_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(PUBLIC_URL, { params, signal });
      return normalize(data);
    },
  });
}

export function useAdminCategories(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_CATEGORIES_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_URL, { params, signal });
      return normalize(data);
    },
    keepPreviousData: true,
  });
}

export default useAdminCategories;
