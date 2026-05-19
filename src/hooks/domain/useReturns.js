/**
 * useReturns / useReturn / useAdminReturns — hooks de React Query.
 *
 *   UC-RET-04 — Listar y ver detalle (comprador)
 *   UC-RET-05 — Bandeja admin
 */

import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const CUSTOMER_URL = '/api/v1/returns/';
const ADMIN_URL    = '/api/v1/admin/returns/';

export const RETURNS_KEY       = ['returns'];
export const ADMIN_RETURNS_KEY = ['returns', 'admin'];

export function useReturns(params = {}) {
  return useQuery({
    queryKey: [...RETURNS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(CUSTOMER_URL, { params, signal });
      return data?.results ?? data ?? [];
    },
  });
}

export function useReturn(id) {
  return useQuery({
    queryKey: [...RETURNS_KEY, 'detail', id],
    enabled:  Boolean(id),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(`${CUSTOMER_URL}${id}/`, { signal });
      return data;
    },
  });
}

export function useAdminReturns(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_RETURNS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_URL, { params, signal });
      return data ?? {};
    },
  });
}

export function useAdminReturn(id) {
  return useQuery({
    queryKey: [...ADMIN_RETURNS_KEY, 'detail', id],
    enabled:  Boolean(id),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(`${ADMIN_URL}${id}/`, { signal });
      return data;
    },
  });
}

export default useReturns;
