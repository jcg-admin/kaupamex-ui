/**
 * useSupportTickets / useSupportTicket — hooks de React Query.
 *
 *   UC-SUPP-02 — Listar tickets / ver detalle (comprador)
 *   UC-SUPP-05 — Bandeja admin
 *
 * Coexisten con `supportTicketsSlice`; las mutaciones (crear,
 * responder, cerrar, reabrir) siguen en Redux.
 */

import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const TICKETS_URL       = '/api/v1/support/tickets/';
const ADMIN_TICKETS_URL = '/api/v1/admin/support/tickets/';

export const SUPPORT_TICKETS_KEY       = ['supportTickets'];
export const ADMIN_SUPPORT_TICKETS_KEY = ['supportTickets', 'admin'];

export function useSupportTickets(params = {}) {
  return useQuery({
    queryKey: [...SUPPORT_TICKETS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(TICKETS_URL, { params, signal });
      return data?.results ?? data ?? [];
    },
  });
}

export function useSupportTicket(id) {
  return useQuery({
    queryKey: [...SUPPORT_TICKETS_KEY, 'detail', id],
    enabled:  Boolean(id),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(`${TICKETS_URL}${id}/`, { signal });
      return data;
    },
  });
}

export function useAdminSupportTickets(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_SUPPORT_TICKETS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_TICKETS_URL, { params, signal });
      return data ?? {};
    },
  });
}

export default useSupportTickets;
