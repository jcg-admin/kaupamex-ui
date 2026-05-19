/**
 * useOrders — hooks de React Query para el dominio Orders.
 *
 *   UC-ORD-02 — Detalle de orden del comprador
 *   UC-ORD-03 — Listado de ordenes del comprador
 *   UC-ORD-07 — Detalle de orden (admin)
 *   UC-ORD-09 — Listado/filtro de ordenes (admin)
 *   UC-ORD-10 — Dashboard transaccional (admin)
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const CUSTOMER_LIST_URL    = '/api/v1/orders/';
const CUSTOMER_DETAIL_URL  = (orderNumber) => `/api/v1/orders/${orderNumber}/`;
const ADMIN_LIST_URL       = '/api/v1/admin/orders/';
const ADMIN_DETAIL_URL     = (orderNumber) => `/api/v1/admin/orders/${orderNumber}/`;
const ADMIN_DASHBOARD_URL  = '/api/v1/admin/dashboard/';

export const ORDERS_LIST_KEY        = ['orders', 'list'];
export const ORDERS_DETAIL_KEY      = ['orders', 'detail'];
export const ADMIN_ORDERS_LIST_KEY  = ['orders', 'admin', 'list'];
export const ADMIN_ORDER_DETAIL_KEY = ['orders', 'admin', 'detail'];
export const ADMIN_DASHBOARD_KEY    = ['orders', 'admin', 'dashboard'];

/** UC-ORD-03: ordenes del comprador autenticado. */
export function useCustomerOrders(params = {}) {
  return useQuery({
    queryKey: [...ORDERS_LIST_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(CUSTOMER_LIST_URL, { params, signal });
      return {
        results: data?.results ?? (Array.isArray(data) ? data : []),
        count:   data?.count ?? null,
      };
    },
  });
}

/** UC-ORD-02: detalle de una orden propia. */
export function useCustomerOrder(orderNumber) {
  return useQuery({
    queryKey: [...ORDERS_DETAIL_KEY, orderNumber],
    enabled:  Boolean(orderNumber),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(CUSTOMER_DETAIL_URL(orderNumber), { signal });
      return data;
    },
  });
}

/** UC-ORD-09: listado/filtro de ordenes (admin). */
export function useAdminOrders(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_ORDERS_LIST_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_LIST_URL, { params, signal });
      return {
        results: data?.results ?? (Array.isArray(data) ? data : []),
        count:   data?.count ?? null,
      };
    },
  });
}

/** UC-ORD-07: detalle de una orden (admin). */
export function useAdminOrder(orderNumber) {
  return useQuery({
    queryKey: [...ADMIN_ORDER_DETAIL_KEY, orderNumber],
    enabled:  Boolean(orderNumber),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_DETAIL_URL(orderNumber), { signal });
      return data;
    },
  });
}

/** UC-ORD-10: dashboard transaccional (admin). */
export function useAdminDashboard() {
  return useQuery({
    queryKey: ADMIN_DASHBOARD_KEY,
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_DASHBOARD_URL, { signal });
      return data;
    },
  });
}

export default useCustomerOrders;
