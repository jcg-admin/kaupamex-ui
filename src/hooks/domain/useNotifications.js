/**
 * useNotifications — hooks de React Query para notificaciones.
 *
 *   UC-NOT-06 — Preferencias (lectura puntual)
 *   useNotificationsList    — bandeja del comprador (lista paginable)
 *   useUnreadNotificationsCount — badge de cabecera
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';

import { useBusListener } from './useBusEvents';

const LIST_URL          = '/api/v2/notifications/';
const UNREAD_COUNT_URL  = '/api/v2/notifications/unread-count/';
const PREFERENCES_URL   = '/api/v2/notifications/preferences/';

export const NOTIFICATIONS_KEY              = ['notifications'];
export const NOTIFICATIONS_UNREAD_COUNT_KEY = ['notifications', 'unread-count'];
export const NOTIFICATION_PREFERENCES_KEY   = ['notifications', 'preferences'];

/** Sondeo de respaldo del badge. El camino rápido es el bus (T-078). */
export const UNREAD_FALLBACK_MS = 300_000;

/**
 * Invalida el contador cuando el bus anuncia una notificación nueva.
 *
 * El evento **no** trae el contador: dispara el refetch del endpoint, que sigue
 * siendo la fuente de verdad (H-API-71). Montarlo una sola vez, donde vive el
 * badge.
 */
export function useNotificationsBusSync({ enabled = true } = {}) {
  const queryClient = useQueryClient();
  return useBusListener('notificacion', () => {
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
  }, { enabled });
}

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
    // Red de seguridad, no el mecanismo principal: el bus avisa a los ~10 s
    // (T-078), así que el sondeo baja de 60 s a 5 min. Se conserva porque el
    // endpoint sigue siendo la verdad — si un evento se pierde, esto lo corrige
    // (H-API-71).
    refetchInterval: UNREAD_FALLBACK_MS,
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
