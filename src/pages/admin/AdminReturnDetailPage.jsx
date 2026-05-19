/**
 * AdminReturnDetailPage — PracticaYoruba
 * UC-RET-02 + UC-RET-03 + UC-RET-06:
 *   Detalle administrativo de una devolución y panel de acciones según
 *   el estado actual:
 *     PENDIENTE_REVISION / PENDIENTE_INFORMACION → aprobar / rechazar /
 *                                                   solicitar información (UC-RET-02)
 *     APROBADA (sin recepción)                   → registrar recepción (UC-RET-03)
 *     COMPLETADA                                  → procesar reembolso (UC-RET-06)
 */
import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { clearReturnsActionState } from '@redux/slices/returnsSlice';
import {
  useAdminReturn,
  ADMIN_RETURNS_KEY,
} from '@hooks/domain/useReturns';
import {
  RETURN_STATUS_LABEL,
  RETURN_STATUS_CLASS,
  REASON_LABEL,
} from '@pages/account/returnStatus';
import AdminReturnReviewPanel    from '@components/returns/AdminReturnReviewPanel';
import AdminReturnReceptionPanel from '@components/returns/AdminReturnReceptionPanel';
import AdminReturnRefundPanel    from '@components/returns/AdminReturnRefundPanel';
import styles from './AdminReturnDetailPage.module.scss';

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX');
}

export default function AdminReturnDetailPage() {
  const { id }      = useParams();
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const { data: current, isLoading, isError } = useAdminReturn(id);
  const lastAction = useSelector((s) => s.returns.lastAction);

  // Tras una mutacion exitosa (aprobar/rechazar/etc) refrescamos el detalle.
  useEffect(() => {
    if (!lastAction) return;
    queryClient.invalidateQueries({ queryKey: ADMIN_RETURNS_KEY });
  }, [lastAction, queryClient]);

  // Al desmontar, limpiar el estado de mutaciones del slice.
  useEffect(() => () => { dispatch(clearReturnsActionState()); }, [dispatch]);

  if (isLoading) return <p className={styles.page}>Cargando devolución…</p>;

  if (isError) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>
          No se encontró la devolución solicitada.
        </p>
        <Link to="/admin/returns" className={styles.backLink}>
          ← Volver a la bandeja
        </Link>
      </section>
    );
  }

  if (!current) return null;

  const items = current.items ?? [];

  return (
    <section className={styles.page} aria-labelledby="admin-return-title">
      <Link to="/admin/returns" className={styles.backLink}>
        ← Volver a la bandeja
      </Link>

      <header className={styles.header}>
        <div>
          <h1 id="admin-return-title" className={styles.title}>
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

      <section className={styles.block} aria-label="Comprador">
        <h2 className={styles.blockTitle}>Comprador</h2>
        <p>
          <strong>{current.customer?.name ?? '—'}</strong>
          <br />
          <span className={styles.customerEmail}>
            {current.customer?.email ?? '—'}
          </span>
        </p>
      </section>

      <section className={styles.block} aria-label="Motivo y descripción">
        <h2 className={styles.blockTitle}>Motivo</h2>
        <p className={styles.reason}>
          {REASON_LABEL[current.reason] ?? current.reason}
        </p>
        {current.description && (
          <p className={styles.description}>{current.description}</p>
        )}
      </section>

      <section className={styles.block} aria-label="Items de la solicitud">
        <h2 className={styles.blockTitle}>Items</h2>
        {items.length === 0 ? (
          <p className={styles.empty}>Sin items registrados.</p>
        ) : (
          <ul className={styles.items}>
            {items.map((item) => (
              <li key={item.id} className={styles.itemRow}>
                <span>{item.product_name}</span>
                <span className={styles.itemQty}>
                  ×{item.quantity} · ${item.price}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AdminReturnReviewPanel    returnRequest={current} />
      <AdminReturnReceptionPanel returnRequest={current} />
      <AdminReturnRefundPanel    returnRequest={current} />
    </section>
  );
}
