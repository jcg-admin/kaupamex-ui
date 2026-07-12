/**
 * useStaticPages — hooks de React Query para páginas de contenido estático
 * (UC-CFG-04, FR-CFG-04.02).
 *
 * - useStaticPages(): lista admin de /api/v2/admin/pages/ (las 5 páginas
 *   canónicas: nosotros/términos/privacidad/devoluciones/faq) con su versión
 *   activa embebida (current_version).
 * - useStaticPage(slug): detalle de una página con sus versiones.
 *
 * La publicación (POST content) se hace con apiService directo en la página y
 * luego invalida las keys.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const STATIC_PAGES_QUERY_KEY = ['admin-static-pages'];

function toList(data) {
  if (data && typeof data === 'object' && 'results' in data) return data.results;
  return Array.isArray(data) ? data : [];
}

export function useStaticPages() {
  return useQuery({
    queryKey: STATIC_PAGES_QUERY_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/admin/pages/', { signal });
      return toList(data);
    },
  });
}

export function useStaticPage(slug) {
  return useQuery({
    queryKey: [...STATIC_PAGES_QUERY_KEY, slug],
    enabled: Boolean(slug),
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get(`/api/v2/admin/pages/${slug}/`, { signal });
      return data;
    },
  });
}

export default useStaticPages;
