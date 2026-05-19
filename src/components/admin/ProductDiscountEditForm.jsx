/**
 * ProductDiscountEditForm — PracticaYoruba
 * UC-DASH-02: Editar descuento de producto (Admin)
 *
 * Permite modificar discount_pct, valid_from y valid_until de un
 * descuento existente. El producto asociado es inmutable y se muestra
 * como solo lectura (Product.name).
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateProductDiscount } from '@redux/slices/productDiscountsSlice';
import styles from './ProductDiscountCreateForm.module.scss';

function validate(fields) {
  const errors = {};
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

export default function ProductDiscountEditForm({ discount, onClose }) {
  const dispatch = useDispatch();
  const { isActioning, actionError } = useSelector((s) => s.productDiscounts);

  const [fields, setFields] = useState({
    discount_pct: discount.discount_pct ?? '',
    valid_from:   discount.valid_from   ?? '',
    valid_until:  discount.valid_until  ?? '',
  });
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
      discount_pct: Number(fields.discount_pct),
      valid_from:   fields.valid_from,
      valid_until:  fields.valid_until || null,
    };

    const result = await dispatch(
      updateProductDiscount({ id: discount.id, ...payload }),
    );
    if (updateProductDiscount.fulfilled.match(result)) {
      onClose?.();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Editar descuento de producto"
      className={styles.overlay}
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>Editar descuento</h2>
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
            <label htmlFor="edit-product">Producto</label>
            <input
              id="edit-product"
              type="text"
              value={discount.product_name ?? ''}
              readOnly
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-pct">Porcentaje (1.00 – 99.99)</label>
            <input
              id="edit-pct"
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
            <label htmlFor="edit-from">Vigente desde</label>
            <input
              id="edit-from"
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
            <label htmlFor="edit-until">Vigente hasta (opcional)</label>
            <input
              id="edit-until"
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
              {actionError.message || 'No se pudo guardar los cambios.'}
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
              {isActioning ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
