/**
 * PaymentStatusPage — PracticaYoruba
 * UC-PAY-05: Ver el estado actual del pago de una orden propia.
 *
 * Lectura: `usePaymentStatus` (React Query). Si el pago esta en estado
 * RECHAZADO o PENDIENTE, ofrece el enlace para reintentar (UC-PAY-08).
 */
import { Link, useParams } from 'react-router-dom';
import { usePaymentStatus } from '@hooks/domain/usePayments';
import styles from './PaymentStatusPage.module.scss';

const STATUS_LABEL = {
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PENDING:  'Pendiente',
  CANCELLED:'Cancelado',
  REFUNDED: 'Reembolsado',
};

const GATEWAY_LABEL = {
  mercadopago: 'Mercado Pago',
  paypal:      'PayPal',
};

function formatCurrency(value, currency = 'MXN') {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('es-MX', { style: 'currency', currency });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX');
}

const RETRY_STATES = new Set(['REJECTED', 'PENDING', 'CANCELLED']);

export default function PaymentStatusPage() {
  const { orderId } = useParams();
  const { data: payment, isLoading, isError } = usePaymentStatus(orderId);

  return (
    <section className={styles.page} aria-labelledby="pay-status-title">
      <header className={styles.header}>
        <h1 id="pay-status-title" className={styles.title}>
          Estado del pago
        </h1>
        <p className={styles.subtitle}>Orden <strong>{orderId}</strong></p>
      </header>

      {isLoading && <p>Cargando estado del pago…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el estado del pago. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !payment && (
        <p className={styles.empty}>No hay intentos de pago registrados.</p>
      )}

      {payment && (
        <article className={styles.card} aria-label="Detalle del pago">
          <dl className={styles.detail}>
            <div>
              <dt>Estado</dt>
              <dd className={styles[`status_${payment.status}`] || styles.statusDefault}>
                {STATUS_LABEL[payment.status] ?? payment.status}
              </dd>
            </div>
            <div>
              <dt>Metodo</dt>
              <dd>{GATEWAY_LABEL[payment.gateway] ?? payment.gateway ?? '—'}</dd>
            </div>
            <div>
              <dt>Monto</dt>
              <dd>{formatCurrency(payment.amount, payment.currency)}</dd>
            </div>
            {payment.installments > 1 && (
              <div>
                <dt>Plan</dt>
                <dd>{payment.installments} cuotas sin intereses</dd>
              </div>
            )}
            <div>
              <dt>Fecha</dt>
              <dd>{formatDateTime(payment.paid_at || payment.created_at)}</dd>
            </div>
            {payment.error_code && (
              <div>
                <dt>Codigo de error</dt>
                <dd className={styles.errorCode}>{payment.error_code}</dd>
              </div>
            )}
          </dl>

          {RETRY_STATES.has(payment.status) && (
            <Link
              to={`/account/orders/${orderId}/payment/retry`}
              className={styles.primaryBtn}
            >
              Reintentar pago
            </Link>
          )}

          <Link to={`/account/orders/${orderId}/payments`} className={styles.secondaryLink}>
            Ver historial completo
          </Link>
        </article>
      )}
    </section>
  );
}
