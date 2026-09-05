/**
 * ProductReviewCreatePage — Kaupamex
 * UC-REV-01: el comprador deja una resena del producto comprado.
 * UC-REV-02 cap6: adjunta hasta 3 fotos a la resena.
 *
 * Captura calificacion (1-5), titulo, texto y hasta 3 imagenes.
 * Paso 1: POST a `/api/v2/products/:productId/reviews/` con order_id.
 * Paso 2 (opcional): por cada imagen seleccionada, POST multipart a
 *   `/api/v2/products/:productId/reviews/:reviewId/images/`.
 *
 * No silencia errores (DEC-DOC-008): cada error de validacion se
 * renderiza visiblemente; errores del API via `serializeApiError`.
 */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  submitProductReview,
  uploadReviewImages,
  clearReviewsActionState,
} from '@redux/slices/reviewsSlice';
import { ExternalDropZone, RatingInput } from '@components/common';
import styles from './ProductReviewCreatePage.module.scss';

const TITLE_MIN   = 5;
const TITLE_MAX   = 100;
const BODY_MIN    = 20;
const BODY_MAX    = 2000;
const MAX_IMAGES  = 3;

export default function ProductReviewCreatePage() {
  const { orderId, productId } = useParams();
  const dispatch = useDispatch();
  const {
    isActioning, actionError, lastAction, lastSubmittedId,
    isUploadingImages, imageUploadError,
  } = useSelector((s) => s.reviews);

  const [rating,       setRating]       = useState(5);
  const [title,        setTitle]        = useState('');
  const [body,         setBody]         = useState('');
  const [error,        setError]        = useState('');
  const [images,       setImages]       = useState([]);   // File[]
  const [previews,     setPreviews]     = useState([]);   // object-URL strings
  const [imagesError,  setImagesError]  = useState('');
  const fileInputRef = useRef(null);

  // Revoke object URLs when images change to avoid memory leaks.
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  // After review is created (lastAction === 'submitted'), upload images.
  useEffect(() => {
    if (lastAction === 'submitted' && lastSubmittedId && images.length > 0) {
      dispatch(uploadReviewImages({
        productId: Number(productId),
        reviewId:  lastSubmittedId,
        images,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAction, lastSubmittedId]);

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > MAX_IMAGES) {
      setImagesError(`Maximo ${MAX_IMAGES} imagenes por resena.`);
      e.target.value = '';
      return;
    }
    setImagesError('');
    setImages(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (index) => {
    URL.revokeObjectURL(previews[index]);
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  // Show success only after images are done uploading (or if there are none).
  const uploadDone = !isUploadingImages;
  if (lastAction === 'submitted' && uploadDone) {
    return (
      <section className={styles.page} aria-labelledby="review-success-title">
        <h1 id="review-success-title" className={styles.title}>
          Resena recibida
        </h1>
        <p className={styles.successMessage}>
          Gracias por tu opinion. Tu resena sera revisada antes de
          publicarse para garantizar la calidad del contenido.
        </p>
        {imageUploadError && (
          <p role="alert" className={styles.error}>
            La resena fue enviada, pero hubo un error al subir las fotos.
          </p>
        )}
      </section>
    );
  }

  const isBusy = isActioning || isUploadingImages;

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
          <label>Calificacion (1-5 estrellas)</label>
          <RatingInput
            value={Number(rating)}
            onChange={setRating}
            max={5}
            label="Calificacion"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="review-title-field">Título</label>
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

        {/* UC-REV-02 cap6 — image upload */}
        <div className={styles.field}>
          <label htmlFor="review-images">
            Fotos del producto (opcional, maximo {MAX_IMAGES})
          </label>
          <ExternalDropZone
            accept="image/*"
            multiple
            onChange={(files) => handleImagesChange({ target: { files } })}
            hint={`Arrastra hasta ${MAX_IMAGES} fotos aquí o usa el selector`}
            className={styles.dropZone}
          >
            <input
              ref={fileInputRef}
              id="review-images"
              type="file"
              accept="image/*"
              multiple
              className={styles.fileInput}
              onChange={handleImagesChange}
            />
          </ExternalDropZone>
          {imagesError && (
            <span className={styles.fieldError}>{imagesError}</span>
          )}
          {previews.length > 0 && (
            <ul className={styles.previewList} aria-label="Fotos seleccionadas">
              {previews.map((src, idx) => (
                <li key={src} className={styles.previewItem}>
                  <img
                    src={src}
                    alt={`Vista previa ${idx + 1}`}
                    className={styles.previewThumb}
                  />
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={() => removeImage(idx)}
                    aria-label={`Eliminar foto ${idx + 1}`}
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          )}
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
            disabled={isBusy}
          >
            {isActioning
              ? 'Enviando…'
              : isUploadingImages
                ? 'Subiendo fotos…'
                : 'Enviar resena'}
          </button>
        </div>
      </form>
    </section>
  );
}
