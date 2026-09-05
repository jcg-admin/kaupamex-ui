/**
 * VoucherEditForm — Kaupamex
 * UC-PRO-02: Editar voucher existente (Admin)
 *
 * Fields code + voucher_type are read-only when current_uses > 0
 * per backend immutability guard (FIELD_IMMUTABLE_WHILE_USED).
 */
import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateVoucher } from '@redux/slices/vouchersSlice';
import useFocusTrap from '@hooks/ui/useFocusTrap';
import styles from './VoucherCreateForm.module.scss';

function validate(fields, isImmutable) {
  const errors = {};
  if (!isImmutable) {
    if (!fields.code.trim()) errors.code = 'El codigo es obligatorio.';
  }
  if (fields.voucher_type === 'FIXED') {
    const v = Number(fields.discount_value);
    if (!fields.discount_value || Number.isNaN(v) || v <= 0)
      errors.discount_value = 'El monto debe ser mayor a 0.';
  }
  if (fields.voucher_type === 'PERCENTAGE') {
    const v = Number(fields.discount_pct);
    if (!fields.discount_pct || Number.isNaN(v) || v <= 0 || v > 100)
      errors.discount_pct = 'El porcentaje debe estar entre 0.01 y 100.';
  }
  return errors;
}

export default function VoucherEditForm({ voucher, onClose }) {
  const dispatch    = useDispatch();
  const { isActioning, actionError } = useSelector((s) => s.vouchers);
  const dialogRef = useRef(null);
  useFocusTrap(dialogRef, true);  // <div role="dialog"> sin trap nativo
  const isImmutable = (voucher.current_uses ?? 0) > 0;

  const [fields, setFields] = useState({
    code:           voucher.code        ?? '',
    voucher_type:   voucher.voucher_type ?? 'FIXED',
    discount_value: voucher.discount_value != null ? String(voucher.discount_value) : '',
    discount_pct:   voucher.discount_pct   != null ? String(voucher.discount_pct)   : '',
    max_discount:   voucher.max_discount   != null ? String(voucher.max_discount)   : '',
    max_uses:       voucher.max_uses       != null ? String(voucher.max_uses)       : '',
    valid_from:     voucher.valid_from  ? voucher.valid_from.slice(0, 10)  : '',
    valid_until:    voucher.valid_until ? voucher.valid_until.slice(0, 10) : '',
    min_order_amount: voucher.min_order_amount != null ? String(voucher.min_order_amount) : '0',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate(fields, isImmutable);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = { id: voucher.id };
    if (!isImmutable) {
      payload.code         = fields.code.trim().toUpperCase();
      payload.voucher_type = fields.voucher_type;
    }
    if (fields.voucher_type === 'FIXED')
      payload.discount_value = Number(fields.discount_value);
    if (fields.voucher_type === 'PERCENTAGE') {
      payload.discount_pct = Number(fields.discount_pct);
      if (fields.max_discount !== '')
        payload.max_discount = Number(fields.max_discount);
    }
    if (fields.max_uses !== '') payload.max_uses = Number(fields.max_uses);
    else payload.max_uses = null;
    if (fields.valid_from)  payload.valid_from  = new Date(fields.valid_from).toISOString();
    if (fields.valid_until) payload.valid_until = new Date(fields.valid_until).toISOString();
    else payload.valid_until = null;
    payload.min_order_amount = Number(fields.min_order_amount || 0);

    const result = await dispatch(updateVoucher(payload));
    if (updateVoucher.fulfilled.match(result)) onClose?.();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Editar cupon"
      className={styles.overlay}
      onClick={(event) => event.target === event.currentTarget && onClose?.()}
    >
      <div className={styles.modal}>
        <header className={styles.header}>
          <h2 className={styles.title}>Editar cupon</h2>
          <button
            type="button"
            aria-label="Cerrar"
            className={styles.closeBtn}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        {isImmutable && (
          <p style={{ padding: '0.5rem 1.25rem', color: '#666', fontSize: '0.85rem', margin: 0 }}>
            Codigo y tipo no editables (el cupon ya tiene usos registrados).
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          {!isImmutable && (
            <>
              <div className={styles.field}>
                <label htmlFor="edit-code">Código</label>
                <input
                  id="edit-code"
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
                <label htmlFor="edit-type">Tipo</label>
                <select
                  id="edit-type"
                  name="voucher_type"
                  value={fields.voucher_type}
                  onChange={handleChange}
                >
                  <option value="FIXED">Monto fijo</option>
                  <option value="PERCENTAGE">Porcentaje</option>
                  <option value="FREE_SHIPPING">Envío gratis</option>
                </select>
              </div>
            </>
          )}

          {fields.voucher_type === 'FIXED' && (
            <div className={styles.field}>
              <label htmlFor="edit-discount-value">Monto de descuento</label>
              <input
                id="edit-discount-value"
                name="discount_value"
                type="number"
                step="0.01"
                value={fields.discount_value}
                onChange={handleChange}
                aria-invalid={Boolean(errors.discount_value)}
              />
              {errors.discount_value && (
                <span className={styles.error}>{errors.discount_value}</span>
              )}
            </div>
          )}

          {fields.voucher_type === 'PERCENTAGE' && (
            <>
              <div className={styles.field}>
                <label htmlFor="edit-discount-pct">Porcentaje (%)</label>
                <input
                  id="edit-discount-pct"
                  name="discount_pct"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100"
                  value={fields.discount_pct}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.discount_pct)}
                />
                {errors.discount_pct && (
                  <span className={styles.error}>{errors.discount_pct}</span>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="edit-max-discount">Descuento máximo (opcional)</label>
                <input
                  id="edit-max-discount"
                  name="max_discount"
                  type="number"
                  step="0.01"
                  value={fields.max_discount}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className={styles.field}>
            <label htmlFor="edit-min-order">Monto mínimo del carrito</label>
            <input
              id="edit-min-order"
              name="min_order_amount"
              type="number"
              step="0.01"
              min="0"
              value={fields.min_order_amount}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-max-uses">Usos maximos (vacio = sin limite)</label>
            <input
              id="edit-max-uses"
              name="max_uses"
              type="number"
              min="1"
              value={fields.max_uses}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-valid-from">Vigente desde</label>
            <input
              id="edit-valid-from"
              name="valid_from"
              type="date"
              value={fields.valid_from}
              onChange={handleChange}
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="edit-valid-until">Vigente hasta (opcional)</label>
            <input
              id="edit-valid-until"
              name="valid_until"
              type="date"
              value={fields.valid_until}
              onChange={handleChange}
            />
          </div>

          {actionError && (
            <p role="alert" className={styles.error}>
              {typeof actionError === 'string' ? actionError : 'No se pudo actualizar el cupon.'}
            </p>
          )}

          <footer className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={isActioning}>
              {isActioning ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
