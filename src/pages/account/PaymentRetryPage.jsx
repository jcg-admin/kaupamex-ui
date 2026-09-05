/**
 * PaymentRetryPage — Kaupamex
 * UC-PAY-08: Reintentar el pago de una orden en PENDING.
 *
 * ADR-018 (Checkout API vía Orders, on-site): reintentar NO es un flujo con
 * redirect a un `checkout_url` — es volver a ejecutar el pago on-site sobre la
 * misma orden. El backend lo documenta en RetryEligibilityView: "si
 * eligible=true, el comprador usa POST /payments/initiate/ para crear un nuevo
 * intento". Ese initiate on-site vive en PaymentSelectionPage
 * (/checkout/payment/:orderId), donde el comprador elige tarjeta (CardForm) o
 * método sin tarjeta (OXXO/SPEI). Esta ruta solo redirige allí para preservar
 * los enlaces existentes (account/orders/:orderId/payment/retry).
 */
import { Navigate, useParams } from 'react-router-dom';

export default function PaymentRetryPage() {
  const { orderId } = useParams();
  return <Navigate to={`/checkout/payment/${orderId}`} replace />;
}
