/**
 * VoucherCreateForm — PracticaYoruba
 * UC-PRO-01: Crear voucher / cupon (Admin)
 *
 * Modal con formulario para crear un cupon de descuento.
 * El admin define codigo, tipo (PERCENT o FIXED), valor, vigencia
 * y limites de uso.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createVoucher } from '@redux/slices/vouchersSlice';
import styles from './VoucherCreateForm.module.scss';

const INITIAL_FIELDS = {
  code:     '',
  type:     'PERCENT',
  value:    '',
  max_uses: '',
  ends_at:  '',
};

function validate(fields) {
  const errors = {};
  if (!fields.code.trim()) {
    errors.code = 'El codigo es obligatorio.';
  }
  const numericValue = Number(fields.value);
  if (fields.value === '' || Number.isNaN(numericValue)) {
    errors.value = 'El valor es obligatorio.';
  } else if (fields.type === 'PERCENT') {
    if (numericValue <= 0 || numericValue > 100) {
      errors.value = 'El porcentaje debe estar entre 0 y 100.';
    }
  } else if (fields.type === 'FIXED') {
    if (numericValue <= 0) {
      errors.value = 'El monto debe ser mayor a 0.';
    }
  }
  return errors;
}

export default function VoucherCreateForm({ onClose }) {
  const dispatch = useDispatch();
  const { isActioning, actionError } = useSelector((s) => s.vouchers);
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
      code:     fields.code.trim().toUpperCase(),
      type:     fields.type,
      value:    Number(fields.value),
      max_uses: fields.max_uses === '' ? null : Number(fields.max_uses),
      ends_at:  fields.ends_at || null,
    };

    const result = await dispatch(createVoucher(payload));
    if (createVoucher.fulfilled.match(result)) {
      onClose?.();
    }
  };

  return (
    <div
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
            <label htmlFor="voucher-code">Codigo</label>
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
              name="type"
              value={fields.type}
              onChange={handleChange}
            >
              <option value="PERCENT">Porcentaje</option>
              <option value="FIXED">Monto fijo</option>
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
            <label htmlFor="voucher-max-uses">Usos maximos (opcional)</label>
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
            <label htmlFor="voucher-ends-at">Fecha fin (opcional)</label>
            <input
              id="voucher-ends-at"
              name="ends_at"
              type="date"
              value={fields.ends_at}
              onChange={handleChange}
            />
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
