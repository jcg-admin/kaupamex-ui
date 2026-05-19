/**
 * PaymentHistoryPage — PracticaYoruba
 * UC-PAY-06: Listado cronologico de intentos de pago de una orden propia,
 * incluyendo fallidos y reembolsos.
 */
import { useParams } from 'react-router-dom';
import { usePaymentHistory } from '@hooks/domain/usePayments';
import styles from './PaymentHistoryPage.module.scss';

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

export default function PaymentHistoryPage() {
  const { orderId } = useParams();
  const { data: items = [], isLoading, isError } = usePaymentHistory(orderId);

  return (
    <section className={styles.page} aria-labelledby="pay-history-title">
      <header className={styles.header}>
        <h1 id="pay-history-title" className={styles.title}>
          Historial de pagos
        </h1>
        <p className={styles.subtitle}>Orden <strong>{orderId}</strong></p>
      </header>

      {isLoading && <p>Cargando historial…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el historial de pagos.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No hay pagos registrados para esta orden.</p>
      )}

      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((p) => (
            <li key={p.id} className={styles.item}>
              <div className={styles.itemMain}>
                <span className={styles.itemKind}>
                  {p.is_refund || p.status === 'REFUNDED' ? 'Reembolso' : 'Cobro'}
                </span>
                <span className={styles[`status_${p.status}`] || styles.statusDefault}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </div>
              <div className={styles.itemMeta}>
                <span>{GATEWAY_LABEL[p.gateway] ?? p.gateway ?? '—'}</span>
                <span>{formatCurrency(p.amount, p.currency)}</span>
                <span>{formatDateTime(p.created_at || p.paid_at)}</span>
              </div>
              {p.error_code && (
                <p className={styles.errorCode}>Codigo: {p.error_code}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
