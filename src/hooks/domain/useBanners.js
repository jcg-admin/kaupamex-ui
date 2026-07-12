/**
 * useBanners — hooks de React Query para banners de portada (UC-CFG-06, G-CFG-01).
 *
 * - useAdminBanners(): lista admin (todos, activos e inactivos) de
 *   /api/v2/admin/banners/. Las mutaciones (crear/editar/borrar/reordenar) se
 *   hacen con apiService directo en la página y luego invalidan la key.
 * - usePublicBanners(placement): lectura pública del storefront de
 *   /api/v2/config/banners/?placement=, sólo activos, cache agresivo (el
 *   contenido cambia poco).
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

export const ADMIN_BANNERS_QUERY_KEY = ['admin-banners'];
export const PUBLIC_BANNERS_QUERY_KEY = ['public-banners'];

function toList(data) {
  if (data && typeof data === 'object' && 'results' in data) return data.results;
  return Array.isArray(data) ? data : [];
}

export function useAdminBanners(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_BANNERS_QUERY_KEY, params],
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get('/api/v2/admin/banners/', { params, signal });
      return toList(data);
    },
  });
}

export function usePublicBanners(placement) {
  return useQuery({
    queryKey: [...PUBLIC_BANNERS_QUERY_KEY, placement ?? 'all'],
    // El contenido de portada cambia poco: cache agresivo (5 min) para no
    // refetchear en cada navegación a la home.
    staleTime: 5 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const params = placement ? { placement } : {};
      const { data } = await apiService.get('/api/v2/config/banners/', { params, signal });
      return toList(data);
    },
  });
}

export default useAdminBanners;
