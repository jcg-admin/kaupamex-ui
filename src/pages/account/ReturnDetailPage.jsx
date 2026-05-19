/**
 * ReturnDetailPage — PracticaYoruba
 * UC-RET-04: Detalle del estado de la devolucion del comprador.
 *
 * Lectura via React Query (`useReturn`). Las mutaciones permanecen
 * en `returnsSlice`.
 */
import { Link, useParams } from 'react-router-dom';
import { useReturn } from '@hooks/domain/useReturns';
import {
  RETURN_STATUS_LABEL,
  RETURN_STATUS_CLASS,
  REASON_LABEL,
  REFUND_STATUS_LABEL,
} from './returnStatus';
import styles from './ReturnDetailPage.module.scss';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX');
}

export default function ReturnDetailPage() {
  const { id } = useParams();
  const { data: current, isLoading, isError } = useReturn(id);

  if (isLoading) return <p className={styles.page}>Cargando devolución…</p>;

  if (isError) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>
          No se encontró la devolución solicitada.
        </p>
        <Link to="/account/returns" className={styles.backLink}>
          ← Volver a mis devoluciones
        </Link>
      </section>
    );
  }

  if (!current) return null;

  const history  = current.history ?? [];
  const refund   = current.refund;
  const rejected = current.status === 'RECHAZADA';

  return (
    <section className={styles.page} aria-labelledby="return-detail-title">
      <Link to="/account/returns" className={styles.backLink}>
        ← Volver a mis devoluciones
      </Link>

      <header className={styles.header}>
        <div>
          <h1 id="return-detail-title" className={styles.title}>
            Devolución #{current.id}
          </h1>
          <p className={styles.meta}>
            Orden <strong>{current.order_id}</strong> · Solicitada el{' '}
            {formatDateTime(current.created_at)}
          </p>
        </div>
        <span className={styles[RETURN_STATUS_CLASS[current.status]] || styles.badgePending}>
          {RETURN_STATUS_LABEL[current.status] ?? current.status}
        </span>
      </header>

      <section className={styles.block} aria-label="Motivo de la devolución">
        <h2 className={styles.blockTitle}>Motivo</h2>
        <p className={styles.reason}>
          {REASON_LABEL[current.reason] ?? current.reason}
        </p>
        {current.description && (
          <p className={styles.description}>{current.description}</p>
        )}
      </section>

      {rejected && current.rejection_reason && (
        <section className={styles.block} aria-label="Motivo del rechazo">
          <h2 className={styles.blockTitle}>Motivo del rechazo</h2>
          <p className={styles.rejection}>{current.rejection_reason}</p>
        </section>
      )}

      <section className={styles.block} aria-label="Historial de estados">
        <h2 className={styles.blockTitle}>Historial</h2>
        {history.length === 0 ? (
          <p className={styles.empty}>Aún no hay eventos registrados.</p>
        ) : (
          <ol className={styles.history}>
            {history.map((event) => (
              <li key={event.id} className={styles.historyItem}>
                <span className={styles.historyStatus}>
                  {RETURN_STATUS_LABEL[event.status] ?? event.status}
                </span>
                <span className={styles.historyDate}>
                  {formatDateTime(event.created_at)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {refund && (
        <section className={styles.block} aria-label="Reembolso asociado">
          <h2 className={styles.blockTitle}>Reembolso</h2>
          <p>
            Estado: <strong>{REFUND_STATUS_LABEL[refund.status] ?? refund.status}</strong>
            {refund.amount != null && (
              <> · Monto: <strong>${refund.amount}</strong></>
            )}
          </p>
        </section>
      )}
    </section>
  );
}
