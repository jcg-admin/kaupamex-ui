/**
 * ProductReviewsListPage — PracticaYoruba
 * UC-REV-02: lista publica de resenas aprobadas de un producto, con
 * calificacion promedio y desglose.
 *
 * Lectura via React Query (`useProductReviews`). Solo se exhiben items
 * con estado APROBADA (filtro responsabilidad del backend, verificado
 * por PRE-01 de UC-REV-02). No silencia errores (DEC-DOC-008): el flag
 * `isError` rinde mensaje visible.
 */
import { useParams } from 'react-router-dom';
import { useProductReviews } from '@hooks/domain/useReviews';
import styles from './ProductReviewsListPage.module.scss';

function StarRating({ value }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  const filled  = '★'.repeat(rounded);
  const empty   = '☆'.repeat(5 - rounded);
  return (
    <span aria-label={`Calificacion ${value}/5`} className={styles.rating}>
      {filled}{empty}
    </span>
  );
}

export default function ProductReviewsListPage() {
  const { productId } = useParams();
  const { data, isLoading, isError } = useProductReviews(productId);
  const reviews = data?.items ?? [];
  const average = data?.average_rating ?? null;
  const total   = data?.total_reviews ?? 0;

  return (
    <section className={styles.page} aria-labelledby="reviews-title">
      <header className={styles.header}>
        <h1 id="reviews-title" className={styles.title}>
          Resenas del producto
        </h1>
      </header>

      {isLoading && <p>Cargando resenas…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar las resenas.
        </p>
      )}

      {!isLoading && total > 0 && (
        <div className={styles.summary} aria-label="resumen de calificaciones">
          <span className={styles.average}>
            {Number(average).toFixed(1)}
          </span>
          <StarRating value={Number(average)} />
          <span className={styles.total}>
            {total} {total === 1 ? 'resena' : 'resenas'}
          </span>
        </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <p className={styles.empty}>
          Aun no hay resenas aprobadas para este producto. Se el primero
          en compartir tu experiencia.
        </p>
      )}

      {reviews.length > 0 && (
        <ul className={styles.list}>
          {reviews.map((r) => (
            <li key={r.id} className={styles.item}>
              <StarRating value={r.rating} />
              <p className={styles.itemTitle}>{r.title}</p>
              <p className={styles.itemBody}>{r.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
