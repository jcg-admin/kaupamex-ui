/**
 * useActiveSessions — hooks React Query para UC-AUTH-17 (H-16).
 *
 * Lista las sesiones activas del usuario (por dispositivo/IP) y permite cerrar
 * una específica. Reemplaza los datos mock de la pantalla de Seguridad.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';

const LIST_URL   = '/api/v2/auth/sessions/active/';
const REVOKE_URL = (id) => `/api/v2/auth/sessions/${id}/revoke/`;

export const ACTIVE_SESSIONS_KEY = ['auth', 'sessions', 'active'];

export function useActiveSessions(options = {}) {
  return useQuery({
    queryKey: ACTIVE_SESSIONS_KEY,
    queryFn: async ({ signal }) => {
      const { data } = await apiService.get(LIST_URL, { signal });
      const results = Array.isArray(data?.results) ? data.results : [];
      return { results, count: data?.count ?? results.length };
    },
    ...options,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiService.post(REVOKE_URL(id), {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ACTIVE_SESSIONS_KEY }),
  });
}

export default useActiveSessions;
