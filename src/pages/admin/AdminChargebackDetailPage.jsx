/**
 * AdminChargebackDetailPage — PracticaYoruba
 * T-17-C: detalle de un contracargo individual.
 */
import { useParams, Link } from 'react-router-dom';
import { useAdminChargeback } from '@hooks/domain/usePayments';
import styles from './AdminChargebackDetailPage.module.scss';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('es-MX');
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function AdminChargebackDetailPage() {
  const { chargebackId } = useParams();
  const { data: cb, isLoading, isError } = useAdminChargeback(chargebackId);

  if (isLoading) return <p className={styles.page}>Cargando contracargo…</p>;

  if (isError || !cb) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>Contracargo no encontrado.</p>
        <Link to="/admin/chargebacks" className={styles.backLink}>
          ← Volver al listado
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="cb-title">
      <Link to="/admin/chargebacks" className={styles.backLink}>
        ← Volver al listado
      </Link>

      <header className={styles.header}>
        <h1 id="cb-title" className={styles.title}>Contracargo</h1>
        <p className={styles.subtitle}>ID: <span className={styles.mono}>{cb.gateway_chargeback_id}</span></p>
      </header>

      <dl className={styles.detail}>
        <div><dt>Pago MP</dt><dd className={styles.mono}>{cb.gateway_payment_id}</dd></div>
        <div><dt>Monto</dt><dd>{formatCurrency(cb.amount)}</dd></div>
        <div><dt>Estado</dt><dd>{cb.status}</dd></div>
        <div><dt>Razon</dt><dd>{cb.reason_code || '—'}</dd></div>
        <div><dt>Fecha</dt><dd>{formatDate(cb.created_at)}</dd></div>
        {cb.description && (
          <div className={styles.fullRow}>
            <dt>Descripción</dt>
            <dd>{cb.description}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
