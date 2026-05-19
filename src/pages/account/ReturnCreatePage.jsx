/**
 * ReturnCreatePage — PracticaYoruba
 * UC-RET-01: Solicitar devolucion (Comprador)
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createReturnRequest,
  clearReturnsActionState,
} from '@redux/slices/returnsSlice';
import styles from './ReturnCreatePage.module.scss';

const REASONS = [
  { value: 'PRODUCTO_DANADO',         label: 'Producto dañado' },
  { value: 'NO_COINCIDE_DESCRIPCION', label: 'No coincide con la descripción' },
  { value: 'CAMBIO_OPINION',          label: 'Cambio de opinión' },
  { value: 'OTRO',                    label: 'Otro motivo' },
];

const MIN_DESCRIPTION = 20;

const INITIAL = {
  order_id:    '',
  reason:      'PRODUCTO_DANADO',
  description: '',
};

// UC-RET-01 Alt A: la subida de evidencias fotograficas es opcional pero
// limitada para evitar payloads abusivos. El backend hace la validacion
// definitiva (image/* MIME, < 5 MB) y devuelve 422 PHOTO_INVALID.
const MAX_PHOTOS         = 4;
const MAX_PHOTO_BYTES    = 5 * 1024 * 1024;
const ACCEPTED_MIME_HINT = 'image/*';

function validate({ order_id, description }, photos) {
  const errors = {};
  if (!order_id.trim()) {
    errors.order_id = 'La orden es obligatoria.';
  }
  if (description.trim().length < MIN_DESCRIPTION) {
    errors.description = `La descripción debe tener al menos ${MIN_DESCRIPTION} caracteres.`;
  }
  if (photos.length > MAX_PHOTOS) {
    errors.photos = `Puedes adjuntar hasta ${MAX_PHOTOS} fotos.`;
  } else {
    const oversized = photos.find((f) => f.size > MAX_PHOTO_BYTES);
    if (oversized) {
      errors.photos = `La foto "${oversized.name}" supera 5 MB.`;
    }
  }
  return errors;
}

export default function ReturnCreatePage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { isActioning, actionError, lastAction, lastCreatedId } =
    useSelector((s) => s.returns);

  const [fields, setFields] = useState(() => ({
    ...INITIAL,
    order_id: searchParams.get('order') ?? '',
  }));
  const [photos, setPhotos] = useState([]);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePhotosChange = (event) => {
    const files = Array.from(event.target.files ?? []);
    setPhotos(files);
    if (errors.photos) setErrors((prev) => ({ ...prev, photos: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const errs = validate(fields, photos);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    dispatch(createReturnRequest({
      order_id:    fields.order_id.trim(),
      reason:      fields.reason,
      description: fields.description.trim(),
      photos,
    }));
  };

  const handleReset = () => {
    setFields(INITIAL);
    setPhotos([]);
    setErrors({});
    dispatch(clearReturnsActionState());
  };

  if (lastAction === 'created' && lastCreatedId) {
    return (
      <section className={styles.page} aria-labelledby="return-success-title">
        <h1 id="return-success-title" className={styles.title}>
          Solicitud registrada
        </h1>
        <p className={styles.successMessage}>
          Tu devolución fue registrada con el número{' '}
          <strong>Devolución #{lastCreatedId}</strong>. El equipo revisará la
          solicitud y te informaremos del resultado por correo.
        </p>
        <div className={styles.successActions}>
          <Link
            to={`/account/returns/${lastCreatedId}`}
            className={styles.primaryBtn}
          >
            Ver mi devolución
          </Link>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleReset}
          >
            Nueva solicitud
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="return-new-title">
      <header className={styles.header}>
        <h1 id="return-new-title" className={styles.title}>
          Solicitar devolución
        </h1>
        <p className={styles.description}>
          Indícanos qué orden y por qué necesitas devolver el producto. El
          plazo y la elegibilidad se verifican al enviar la solicitud.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="return-order">Orden a devolver</label>
          <input
            id="return-order"
            name="order_id"
            type="text"
            placeholder="Ej. ORD-12345678"
            value={fields.order_id}
            onChange={handleChange}
            aria-invalid={Boolean(errors.order_id)}
          />
          {errors.order_id && (
            <span className={styles.error}>{errors.order_id}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="return-reason">Motivo</label>
          <select
            id="return-reason"
            name="reason"
            value={fields.reason}
            onChange={handleChange}
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="return-description">Descripción del problema</label>
          <textarea
            id="return-description"
            name="description"
            rows={6}
            value={fields.description}
            onChange={handleChange}
            aria-invalid={Boolean(errors.description)}
          />
          {errors.description && (
            <span className={styles.error}>{errors.description}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="return-photos">
            Fotos del producto (opcional)
          </label>
          <input
            id="return-photos"
            name="photos"
            type="file"
            accept={ACCEPTED_MIME_HINT}
            multiple
            onChange={handlePhotosChange}
            aria-invalid={Boolean(errors.photos)}
          />
          <small className={styles.hint}>
            Hasta {MAX_PHOTOS} imágenes (máx. 5 MB cada una). Útiles si
            el motivo es "Producto dañado" o "No coincide con la descripción".
          </small>
          {errors.photos && (
            <span className={styles.error}>{errors.photos}</span>
          )}
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {typeof actionError === 'string'
              ? actionError
              : 'No se pudo enviar la solicitud. Intenta de nuevo.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </section>
  );
}
