/**
 * AdminReviewsModerationPage — PracticaYoruba
 * UC-REV-03: cola admin de resenas en estado PENDING_MODERATION.
 *
 * Cada item se puede aprobar (publica en UC-REV-02) o rechazar con
 * motivo. Lectura via React Query (`useAdminReviewsModeration`),
 * mutaciones via `reviewsSlice` (approve/reject) que serializan
 * errores. No silencia errores (DEC-DOC-008): `actionError` se rinde
 * visible con `role="alert"`.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  approveProductReview,
  rejectProductReview,
  clearReviewsActionState,
} from '@redux/slices/reviewsSlice';
import { useAdminReviewsModeration } from '@hooks/domain/useReviews';
import styles from './AdminReviewsModerationPage.module.scss';

const REJECT_REASONS = [
  { value: 'CONTENIDO_INAPROPIADO', label: 'Contenido inapropiado' },
  { value: 'SPAM',                  label: 'Spam' },
  { value: 'IDIOMA_NO_SOPORTADO',   label: 'Idioma no soportado' },
  { value: 'NO_RELACIONADA',        label: 'No relacionada al producto' },
];

export default function AdminReviewsModerationPage() {
  const dispatch = useDispatch();
  const { data: reviews = [], isLoading, isError } =
    useAdminReviewsModeration();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.reviews);
  const [reasons, setReasons] = useState({});

  const setReason = (id, value) =>
    setReasons((prev) => ({ ...prev, [id]: value }));

  const handleApprove = (id) => {
    dispatch(clearReviewsActionState());
    dispatch(approveProductReview({ id }));
  };

  const handleReject = (id) => {
    const reason = reasons[id] || 'CONTENIDO_INAPROPIADO';
    dispatch(clearReviewsActionState());
    dispatch(rejectProductReview({ id, reason }));
  };

  return (
    <section className={styles.page} aria-labelledby="moderation-title">
      <header className={styles.header}>
        <h1 id="moderation-title" className={styles.title}>
          Moderacion de resenas
        </h1>
      </header>

      {isLoading && <p>Cargando cola…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la cola de moderacion.
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message || 'No se pudo aplicar la moderacion.'}
        </p>
      )}

      {lastAction === 'approved' && (
        <p role="status" className={styles.success}>Resena aprobada.</p>
      )}
      {lastAction === 'rejected' && (
        <p role="status" className={styles.success}>Resena rechazada.</p>
      )}

      {!isLoading && reviews.length === 0 && (
        <p className={styles.empty}>No hay resenas pendientes de moderacion.</p>
      )}

      <ul className={styles.list}>
        {reviews.map((r) => (
          <li key={r.id} className={styles.item}>
            <p className={styles.meta}>
              <strong>#{r.id}</strong>
              {r.product?.name && (
                <> · sobre <em>{r.product.name}</em></>
              )}
              {typeof r.rating === 'number' && (
                <> · {r.rating} estrellas</>
              )}
            </p>
            <p className={styles.itemTitle}>{r.title}</p>
            <p className={styles.itemBody}>{r.body}</p>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => handleApprove(r.id)}
                disabled={isActioning}
              >
                Aprobar
              </button>

              <label className={styles.reasonField}>
                <span>Motivo de rechazo</span>
                <select
                  value={reasons[r.id] || 'CONTENIDO_INAPROPIADO'}
                  onChange={(e) => setReason(r.id, e.target.value)}
                >
                  {REJECT_REASONS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => handleReject(r.id)}
                disabled={isActioning}
              >
                Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
