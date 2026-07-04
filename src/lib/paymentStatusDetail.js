/**
 * paymentStatusDetail — traducción de `status_detail` de MercadoPago a mensaje
 * humano (PG-02).
 *
 * Fuente de verdad única para todas las pantallas de pago (rechazo, pendiente,
 * resultado). Antes el mapeo vivía inline en PaymentFailedPage; se extrajo aquí
 * para reusarlo (evita duplicación — l-ui-01). Los códigos provienen de la §5
 * de analisis-pasarela.md.
 */

// Cada entrada: { t: título corto, d: detalle accionable }.
export const STATUS_DETAIL_MESSAGES = {
  // Aprobado
  accredited: {
    t: 'Pago aprobado',
    d: 'Tu pago se acreditó correctamente.',
  },
  // Pendientes (métodos diferidos / revisión)
  pending_waiting_payment: {
    t: 'Esperando tu pago',
    d: 'Aún no recibimos el pago. Completa la transferencia o el pago en efectivo con las instrucciones del voucher.',
  },
  pending_waiting_transfer: {
    t: 'Esperando tu transferencia',
    d: 'Realiza la transferencia SPEI con la CLABE indicada; en cuanto la recibamos confirmaremos tu pedido.',
  },
  pending_contingency: {
    t: 'Pago en revisión',
    d: 'Estamos validando el pago con el banco. Esto puede tardar unos minutos; te avisaremos del resultado.',
  },
  // Rechazos de tarjeta
  cc_rejected_insufficient_amount: {
    t: 'Fondos insuficientes',
    d: 'El banco emisor de tu tarjeta no autorizó el cargo. Verifica tu límite de crédito o intenta con otra tarjeta.',
  },
  cc_rejected_bad_filled_card_number: {
    t: 'Número de tarjeta incorrecto',
    d: 'Verifica los datos de la tarjeta e intenta de nuevo.',
  },
  cc_rejected_bad_filled_security_code: {
    t: 'CVV incorrecto',
    d: 'Verifica el código de seguridad al reverso de tu tarjeta.',
  },
  cc_rejected_bad_filled_date: {
    t: 'Fecha de vencimiento incorrecta',
    d: 'Verifica la fecha de expiración de tu tarjeta.',
  },
  cc_rejected_call_for_authorize: {
    t: 'Autorización requerida',
    d: 'Debes autorizar el monto con tu banco antes de reintentar.',
  },
  cc_rejected_high_risk: {
    t: 'Pago rechazado por seguridad',
    d: 'El pago fue rechazado por prevención de fraude. Intenta con otro método de pago.',
  },
  cc_rejected_other_reason: {
    t: 'Pago rechazado',
    d: 'Tu banco rechazó el cargo. Intenta con otro método de pago.',
  },
};

const FALLBACK = STATUS_DETAIL_MESSAGES.cc_rejected_other_reason;

/**
 * Devuelve `{ t, d }` para un `status_detail`. Si el código no está mapeado,
 * cae a un rechazo genérico (nunca devuelve undefined).
 */
export function paymentStatusDetail(code) {
  return STATUS_DETAIL_MESSAGES[code] || FALLBACK;
}

export default paymentStatusDetail;
