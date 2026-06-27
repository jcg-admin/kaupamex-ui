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
import apiService, { getPaymentMethods } from '@services/apiService';

const PAYMENT_HISTORY_URL   = (orderId) => `/api/v2/payments/${orderId}/history/`;
const PAYMENT_STATUS_URL    = (orderId) => `/api/v2/payments/${orderId}/status/`;
const ADMIN_PAYMENTS_URL    = '/api/v2/admin/payments/';

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
      const { data } = await apiService.get(PAYMENT_HISTORY_URL(orderId), { signal });
      return Array.isArray(data) ? data : (data?.results ?? []);
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

/**
 * UC-PAY-15: lista los métodos de pago disponibles en MercadoPago.
 * El backend consulta MP con el access_token y retorna datos públicos.
 * staleTime: 10min — los métodos disponibles no cambian con frecuencia.
 */
export const MP_METHODS_KEY = ['payments', 'methods'];

export function usePaymentMethods() {
  return useQuery({
    queryKey:  MP_METHODS_KEY,
    staleTime: 10 * 60 * 1000,
    queryFn:   async ({ signal }) => {
      const { data } = await getPaymentMethods({ signal });
      return Array.isArray(data) ? data : [];
    },
  });
}

export default usePaymentStatus;
