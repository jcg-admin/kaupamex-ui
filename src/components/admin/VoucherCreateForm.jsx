/**
 * VoucherCreateForm — Kaupamex
 * UC-PRO-01: Crear voucher / cupon (Admin)
 *
 * Modal con formulario para crear un cupon de descuento.
 * El admin define codigo, tipo (PERCENT o FIXED), valor, vigencia
 * y limites de uso.
 */
import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createVoucher } from '@redux/slices/vouchersSlice';
import useFocusTrap from '@hooks/ui/useFocusTrap';
import styles from './VoucherCreateForm.module.scss';

const INITIAL_FIELDS = {
  code:         '',
  voucher_type: 'PERCENTAGE',
  value:        '',
  max_uses:     '',
  valid_from:   '',
  valid_until:  '',
};

function validate(fields) {
  const errors = {};
  if (!fields.code.trim()) {
    errors.code = 'El codigo es obligatorio.';
  }
  if (!fields.valid_from) {
    errors.valid_from = 'La fecha de inicio es obligatoria.';
  }
  const numericValue = Number(fields.value);
  if (fields.value === '' || Number.isNaN(numericValue)) {
    errors.value = 'El valor es obligatorio.';
  } else if (fields.voucher_type === 'PERCENTAGE') {
    if (numericValue <= 0 || numericValue > 100) {
      errors.value = 'El porcentaje debe estar entre 0 y 100.';
    }
  } else if (fields.voucher_type === 'FIXED') {
    if (numericValue <= 0) {
      errors.value = 'El monto debe ser mayor a 0.';
    }
  }
  if (fields.valid_from && fields.valid_until && fields.valid_until <= fields.valid_from) {
    errors.valid_until = 'La fecha fin debe ser posterior a la fecha de inicio.';
  }
  return errors;
}

export default function VoucherCreateForm({ onClose }) {
  const dispatch = useDispatch();
  const { isActioning, actionError } = useSelector((s) => s.vouchers);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);  // <div role="dialog"> sin trap nativo
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      code:         fields.code.trim().toUpperCase(),
      voucher_type: fields.voucher_type,
      max_uses:     fields.max_uses === '' ? null : Number(fields.max_uses),
      valid_from:   fields.valid_from ? new Date(fields.valid_from).toISOString() : undefined,
      valid_until:  fields.valid_until ? new Date(fields.valid_until).toISOString() : null,
    };
    if (fields.voucher_type === 'PERCENTAGE') {
      payload.discount_pct = Number(fields.value);
    } else if (fields.voucher_type === 'FIXED') {
      payload.discount_value = Number(fields.value);
    }

    const result = await dispatch(createVoucher(payload));
    if (createVoucher.fulfilled.match(result)) {
      onClose?.();
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo cupon"
      className={styles.overlay}
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>Nuevo cupon</h2>
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
            <label htmlFor="voucher-code">Código</label>
            <input
              id="voucher-code"
              name="code"
              type="text"
              autoComplete="off"
              value={fields.code}
              onChange={handleChange}
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code && <span className={styles.error}>{errors.code}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="voucher-type">Tipo</label>
            <select
              id="voucher-type"
              name="voucher_type"
              value={fields.voucher_type}
              onChange={handleChange}
            >
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED">Monto fijo</option>
              <option value="FREE_SHIPPING">Envío gratis</option>
            </select>
          </div>

          <div className={styles.field}>
            <label htmlFor="voucher-value">Valor</label>
            <input
              id="voucher-value"
              name="value"
              type="number"
              step="0.01"
              value={fields.value}
              onChange={handleChange}
              aria-invalid={Boolean(errors.value)}
            />
            {errors.value && <span className={styles.error}>{errors.value}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="voucher-max-uses">Usos máximos (opcional)</label>
            <input
              id="voucher-max-uses"
              name="max_uses"
              type="number"
              min="1"
              value={fields.max_uses}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="voucher-valid-from">Vigente desde *</label>
            <input
              id="voucher-valid-from"
              name="valid_from"
              type="date"
              value={fields.valid_from}
              onChange={handleChange}
              aria-invalid={Boolean(errors.valid_from)}
            />
            {errors.valid_from && <span className={styles.error}>{errors.valid_from}</span>}
          </div>

          <div className={styles.field}>
            <label htmlFor="voucher-valid-until">Vigente hasta (opcional)</label>
            <input
              id="voucher-valid-until"
              name="valid_until"
              type="date"
              value={fields.valid_until}
              onChange={handleChange}
              aria-invalid={Boolean(errors.valid_until)}
            />
            {errors.valid_until && <span className={styles.error}>{errors.valid_until}</span>}
          </div>

          {actionError && (
            <p role="alert" className={styles.error}>
              {typeof actionError === 'string'
                ? actionError
                : 'No se pudo crear el cupon.'}
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
              {isActioning ? 'Creando…' : 'Crear cupon'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
