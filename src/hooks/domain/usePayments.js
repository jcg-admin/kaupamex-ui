/**
 * usePayments — hooks de React Query para el dominio Payments.
 *
 *   UC-PAY-05 — Ver estado de pago de una orden (comprador)
 *   UC-PAY-06 — Ver historial de pagos de una orden (comprador)
 *   UC-PAY-11 — Reporte de transacciones (admin)
 *
 * Las mutaciones (UC-PAY-01, UC-PAY-02, UC-PAY-08, UC-PAY-09) viven
 * en `src/redux/slices/paymentsSlice.js`.
 */
import { useQuery } from '@tanstack/react-query';
import apiService from '@services/apiService';

const PAYMENTS_BY_ORDER_URL = (orderId) => `/api/v1/payments/?order_id=${encodeURIComponent(orderId)}`;
const PAYMENT_STATUS_URL    = (orderId) => `/api/v1/payments/?order_id=${encodeURIComponent(orderId)}&latest=true`;
const ADMIN_PAYMENTS_URL    = '/api/v1/admin/payments/';

export const PAYMENTS_KEY            = ['payments'];
export const PAYMENT_STATUS_KEY      = ['payments', 'status'];
export const PAYMENT_HISTORY_KEY     = ['payments', 'history'];
export const ADMIN_PAYMENTS_KEY      = ['payments', 'admin'];

/**
 * UC-PAY-05: estado actual del pago de una orden propia.
 * El backend devuelve el `Payment` mas reciente bajo `latest=true`.
 */
export function usePaymentStatus(orderId) {
  return useQuery({
    queryKey: [...PAYMENT_STATUS_KEY, orderId],
    enabled:  Boolean(orderId),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(PAYMENT_STATUS_URL(orderId), { signal });
      if (Array.isArray(data?.results)) return data.results[0] ?? null;
      if (Array.isArray(data))          return data[0] ?? null;
      return data ?? null;
    },
  });
}

/**
 * UC-PAY-06: historial completo de pagos (incluye intentos, fallidos
 * y reembolsos) para una orden propia.
 */
export function usePaymentHistory(orderId) {
  return useQuery({
    queryKey: [...PAYMENT_HISTORY_KEY, orderId],
    enabled:  Boolean(orderId),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(PAYMENTS_BY_ORDER_URL(orderId), { signal });
      return data?.results ?? (Array.isArray(data) ? data : []);
    },
  });
}

/**
 * UC-PAY-11: listado paginado de pagos para el admin con filtros
 * por estado, gateway y rango de fechas.
 *
 * Respuesta esperada:
 *   `{ results: Payment[], count, totals: { approved, refunded, net } }`.
 */
export function useAdminPayments(params = {}) {
  return useQuery({
    queryKey: [...ADMIN_PAYMENTS_KEY, params],
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(ADMIN_PAYMENTS_URL, { params, signal });
      return {
        results: data?.results ?? (Array.isArray(data) ? data : []),
        count:   data?.count ?? null,
        totals:  data?.totals ?? null,
      };
    },
  });
}

/**
 * UC-PAY-09: el admin abre el detalle de un Payment antes de procesar el reembolso.
 */
export function useAdminPayment(paymentId) {
  return useQuery({
    queryKey: [...ADMIN_PAYMENTS_KEY, 'detail', paymentId],
    enabled:  Boolean(paymentId),
    queryFn:  async ({ signal }) => {
      const { data } = await apiService.get(`${ADMIN_PAYMENTS_URL}${paymentId}/`, { signal });
      return data;
    },
  });
}

export default usePaymentStatus;
