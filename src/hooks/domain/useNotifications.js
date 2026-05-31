/**
 * useNotifications — hooks de React Query para notificaciones.
 *
 *   UC-NOT-06 — Preferencias (lectura puntual)
 *   useNotificationsList    — bandeja del comprador (lista paginable)
 *   useUnreadNotificationsCount — badge de cabecera
 */

import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const LIST_URL          = '/api/v1/notifications/';
const UNREAD_COUNT_URL  = '/api/v1/notifications/unread-count/';
const PREFERENCES_URL   = '/api/v1/notifications/preferences/';

export const NOTIFICATIONS_KEY              = ['notifications'];
export const NOTIFICATIONS_UNREAD_COUNT_KEY = ['notifications', 'unread-count'];
export const NOTIFICATION_PREFERENCES_KEY   = ['notifications', 'preferences'];

/**
 * H-CICLO88-02: la API ahora pagina la bandeja (PageNumberPagination,
 * page_size=50, max 500 filas totales).  El hook devuelve la forma
 * paginada completa { results, count, next, previous } para que la UI
 * pueda mostrar un boton "Cargar mas" cuando exista pagina siguiente.
 */
export function useNotificationsList(params = {}) {
  return useQuery({
    queryKey: [...NOTIFICATIONS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(LIST_URL, { params, signal });
      // Si la respuesta ya es paginada (tiene count + results) la devolvemos
      // directamente.  Si es el formato legacy { results: [] } construimos
      // un envelope compatible.
      if (data && typeof data.count !== 'undefined') {
        return data;
      }
      const results = data?.results ?? data?.notifications ?? data ?? [];
      return { results, count: results.length, next: null, previous: null };
    },
  });
}

export function useUnreadNotificationsCount({ enabled = true } = {}) {
  return useQuery({
    queryKey: NOTIFICATIONS_UNREAD_COUNT_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(UNREAD_COUNT_URL, { signal });
      return data?.count ?? data?.unread_count ?? 0;
    },
    enabled,
    // Refresca el badge cada minuto sin requerir interaccion.
    refetchInterval: 60_000,
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: NOTIFICATION_PREFERENCES_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(PREFERENCES_URL, { signal });
      return data?.results ?? data?.preferences ?? data ?? [];
    },
  });
}

export default useNotificationsList;
