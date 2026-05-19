/**
 * ProductDiscountCreateForm — PracticaYoruba
 * UC-DASH-01: Crear descuento de producto (Admin)
 *
 * Modal con formulario para crear un ProductDiscount sobre un producto
 * activo. Valida porcentaje (1.00 – 99.99) y rango de fechas.
 *
 * Tras el exito invalida la query `['product-discounts']` mediante el
 * efecto en AdminProductDiscountsPage (lastAction = 'created').
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createProductDiscount } from '@redux/slices/productDiscountsSlice';
import styles from './ProductDiscountCreateForm.module.scss';

const INITIAL_FIELDS = {
  product_id:   '',
  discount_pct: '',
  valid_from:   '',
  valid_until:  '',
};

function validate(fields) {
  const errors = {};
  if (!String(fields.product_id).trim()) {
    errors.product_id = 'El producto es obligatorio.';
  }
  const pct = Number(fields.discount_pct);
  if (fields.discount_pct === '' || Number.isNaN(pct)) {
    errors.discount_pct = 'El porcentaje es obligatorio.';
  } else if (pct < 1 || pct > 99.99) {
    errors.discount_pct = 'El porcentaje debe estar entre 1.00 y 99.99.';
  }
  if (!fields.valid_from) {
    errors.valid_from = 'La fecha de inicio es obligatoria.';
  }
  if (
    fields.valid_from && fields.valid_until &&
    fields.valid_from > fields.valid_until
  ) {
    errors.valid_until = 'La fecha de fin no puede ser anterior al inicio.';
  }
  return errors;
}

export default function ProductDiscountCreateForm({ onClose }) {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.productDiscounts);
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      product_id:   Number(fields.product_id),
      discount_pct: Number(fields.discount_pct),
      valid_from:   fields.valid_from,
      valid_until:  fields.valid_until || null,
    };

    const result = await dispatch(createProductDiscount(payload));
    if (createProductDiscount.fulfilled.match(result)) {
      onClose?.();
    }
  };

  // Si el slice ya emite lastAction 'created' por otro flujo, cerramos.
  if (lastAction === 'created') {
    queueMicrotask(() => onClose?.());
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo descuento de producto"
      className={styles.overlay}
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>Nuevo descuento</h2>
          <button
            type="button"
            aria-label="Cerrar"
            className={styles.closeBtn}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="discount-product">ID del producto</label>
            <input
              id="discount-product"
              name="product_id"
              type="number"
              min="1"
              value={fields.product_id}
              onChange={handleChange}
              aria-invalid={Boolean(errors.product_id)}
            />
            {errors.product_id && (
              <span className={styles.error}>{errors.product_id}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="discount-pct">Porcentaje (1.00 – 99.99)</label>
            <input
              id="discount-pct"
              name="discount_pct"
              type="number"
              step="0.01"
              min="1"
              max="99.99"
              value={fields.discount_pct}
              onChange={handleChange}
              aria-invalid={Boolean(errors.discount_pct)}
            />
            {errors.discount_pct && (
              <span className={styles.error}>{errors.discount_pct}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="discount-from">Vigente desde</label>
            <input
              id="discount-from"
              name="valid_from"
              type="date"
              value={fields.valid_from}
              onChange={handleChange}
              aria-invalid={Boolean(errors.valid_from)}
            />
            {errors.valid_from && (
              <span className={styles.error}>{errors.valid_from}</span>
            )}
          </div>

          <div className={styles.field}>
            <label htmlFor="discount-until">Vigente hasta (opcional)</label>
            <input
              id="discount-until"
              name="valid_until"
              type="date"
              value={fields.valid_until}
              onChange={handleChange}
              aria-invalid={Boolean(errors.valid_until)}
            />
            {errors.valid_until && (
              <span className={styles.error}>{errors.valid_until}</span>
            )}
          </div>

          {actionError && (
            <p role="alert" className={styles.error}>
              {actionError.message || 'No se pudo crear el descuento.'}
            </p>
          )}

          <footer className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isActioning}
            >
              {isActioning ? 'Creando…' : 'Crear descuento'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
