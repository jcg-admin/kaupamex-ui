/**
 * AdminReviewsModerationPage — Kaupamex
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
import { Button } from '@components/common/primitives';
import styles from './AdminReviewsModerationPage.module.scss';

const REJECT_REASONS = [
  { value: 'CONTENIDO_INAPROPIADO', label: 'Contenido inapropiado' },
  { value: 'SPAM',                  label: 'Spam' },
  { value: 'LANGUAGE_NOT_SUPPORTED',   label: 'Idioma no soportado' },
  { value: 'NO_RELACIONADA',        label: 'No relacionada al producto' },
];

export default function AdminReviewsModerationPage() {
  const dispatch = useDispatch();
  // H-CICLO106-02: la API pagina a page_size=50 (H-CICLO90-01). Sin
  // controles de paginacion el admin solo ve la primera pagina y no puede
  // acceder a resenas pendientes en paginas posteriores.
  const [page, setPage] = useState(1);
  const { data: pageData, isLoading, isError } =
    useAdminReviewsModeration(page);
  const reviews = pageData?.results ?? [];
  const hasNext = Boolean(pageData?.next);
  const hasPrev = page > 1;
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
          Moderación de reseñas
        </h1>
      </header>

      {isLoading && <p>Cargando cola…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la cola de moderación.
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message || 'No se pudo aplicar la moderación.'}
        </p>
      )}

      {lastAction === 'approved' && (
        <p role="status" className={styles.success}>Reseña aprobada.</p>
      )}
      {lastAction === 'rejected' && (
        <p role="status" className={styles.success}>Reseña rechazada.</p>
      )}

      {!isLoading && reviews.length === 0 && (
        <p className={styles.empty}>No hay reseñas pendientes de moderación.</p>
      )}

      {/* H-CICLO106-02: controles de paginacion para navegar la cola de
          moderacion. La API pagina a page_size=50 (H-CICLO90-01); sin estos
          controles el admin solo ve las primeras 50 resenas pendientes. */}
      {(hasNext || hasPrev) && (
        <div className={styles.pagination}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev || isLoading}
          >
            Anterior
          </Button>
          <span>Página {page}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isLoading}
          >
            Siguiente
          </Button>
        </div>
      )}

      <ul className={styles.list}>
        {reviews.map((r) => (
          <li key={r.id} className={styles.item}>
            <p className={styles.meta}>
              <strong>#{r.id}</strong>
              {/* H-CICLO36-03: AdminReviewSerializer expone product_name (no product.name) */}
              {(r.product_name ?? r.product?.name) && (
                <> · sobre <em>{r.product_name ?? r.product.name}</em></>
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
