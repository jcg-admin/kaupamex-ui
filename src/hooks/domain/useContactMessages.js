/**
 * useContactMessages / useContactMessage — hooks de React Query.
 *
 *   UC-COM-02 — Bandeja admin de mensajes de contacto
 *   UC-COM-03 — Detalle del mensaje para responder
 *
 * Coexisten con `contactSlice`; las mutaciones (envio publico, marcar
 * leido, responder) viven en Redux + `lastAction`.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const ADMIN_CONTACT_LIST_URL   = '/api/v1/admin/contact/messages/';
const ADMIN_CONTACT_DETAIL_URL = (id) => `/api/v1/admin/contact/messages/${id}/`;

export const ADMIN_CONTACT_MESSAGES_KEY = ['contact', 'admin', 'messages'];

export function useAdminContactMessages(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_CONTACT_MESSAGES_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_CONTACT_LIST_URL, {
        params,
        signal,
      });
      return data ?? {};
    },
  });
}

export function useAdminContactMessage(id) {
  return useQuery({
    queryKey: [...ADMIN_CONTACT_MESSAGES_KEY, 'detail', id],
    enabled:  Boolean(id),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_CONTACT_DETAIL_URL(id), {
        signal,
      });
      return data;
    },
  });
}

export default useAdminContactMessages;
