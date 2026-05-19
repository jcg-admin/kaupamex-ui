/**
 * ProductReviewCreatePage — PracticaYoruba
 * UC-REV-01: el comprador deja una resena del producto comprado.
 *
 * Captura calificacion (1-5), titulo y texto. POSTea a
 * `/api/v1/products/:productId/reviews/` con `order_id` para que el
 * backend verifique que el comprador recibio el producto en esa orden
 * (PRE-01) y que no existe resena previa (PRE-02).
 *
 * No silencia errores (DEC-DOC-008): cada error de validacion del
 * formulario se renderiza visiblemente; los errores del API caen en
 * `actionError` propagados por `reviewsSlice` via `serializeApiError`.
 */
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitProductReview,
  clearReviewsActionState,
} from '@redux/slices/reviewsSlice';
import styles from './ProductReviewCreatePage.module.scss';

const TITLE_MIN  = 5;
const TITLE_MAX  = 100;
const BODY_MIN   = 20;
const BODY_MAX   = 2000;

export default function ProductReviewCreatePage() {
  const { orderId, productId } = useParams();
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.reviews);

  const [rating, setRating] = useState(5);
  const [title,  setTitle]  = useState('');
  const [body,   setBody]   = useState('');
  const [error,  setError]  = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedBody  = body.trim();

    if (
      trimmedTitle.length < TITLE_MIN || trimmedTitle.length > TITLE_MAX ||
      trimmedBody.length  < BODY_MIN  || trimmedBody.length  > BODY_MAX
    ) {
      setError(
        `Titulo y texto son obligatorios. Titulo ${TITLE_MIN}-${TITLE_MAX} caracteres, ` +
        `texto ${BODY_MIN}-${BODY_MAX} caracteres.`,
      );
      return;
    }
    setError('');
    dispatch(clearReviewsActionState());
    dispatch(submitProductReview({
      productId: Number(productId),
      orderId:   Number(orderId),
      rating:    Number(rating),
      title:     trimmedTitle,
      body:      trimmedBody,
    }));
  };

  if (lastAction === 'submitted') {
    return (
      <section className={styles.page} aria-labelledby="review-success-title">
        <h1 id="review-success-title" className={styles.title}>
          Resena recibida
        </h1>
        <p className={styles.successMessage}>
          Gracias por tu opinion. Tu resena sera revisada antes de
          publicarse para garantizar la calidad del contenido.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="review-title">
      <header className={styles.header}>
        <h1 id="review-title" className={styles.title}>Dejar resena del producto</h1>
        <p className={styles.description}>
          Tu opinion ayuda a otros compradores. La resena pasara por
          moderacion antes de publicarse.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="review-rating">Calificacion (1-5 estrellas)</label>
          <select
            id="review-rating"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
          >
            <option value="5">5 - Excelente</option>
            <option value="4">4 - Muy bueno</option>
            <option value="3">3 - Regular</option>
            <option value="2">2 - Malo</option>
            <option value="1">1 - Muy malo</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="review-title-field">Titulo</label>
          <input
            id="review-title-field"
            type="text"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="review-body">Texto de la resena</label>
          <textarea
            id="review-body"
            rows={6}
            maxLength={BODY_MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            aria-invalid={Boolean(error)}
          />
          {error && <span className={styles.fieldError}>{error}</span>}
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo enviar la resena.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Enviando…' : 'Enviar resena'}
          </button>
        </div>
      </form>
    </section>
  );
}
