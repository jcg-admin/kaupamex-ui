/**
 * Common primitives — Práctica Yorùbà
 * Componentes pequeños reutilizados en todas las pages.
 */

import { useRef, useLayoutEffect } from 'react';
import { cx } from '@utils/cx';
import styles from './primitives.module.scss';

export function MetaTag({ children, tone = 'bronze', className = '' }) {
  const toneClass = {
    bronze: styles.metaTagBronze,
    lime:   styles.metaTagLime,
    coral:  styles.metaTagCoral,
    vino:   styles.metaTagVino,
    muted:  styles.metaTagMuted,
  }[tone] || styles.metaTagBronze;

  return (
    <span className={`${styles.metaTag} ${toneClass} ${className}`}>
      {children}
    </span>
  );
}

export function Price({ amount, size = 'md', showCurrency = false, className = '' }) {
  const formatted = new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(amount) || 0);

  const sizeClass = {
    sm: styles.priceSm,
    md: styles.priceMd,
    lg: styles.priceLg,
    xl: styles.priceXl,
  }[size] || styles.priceMd;

  return (
    <span className={`${styles.price} ${sizeClass} ${className}`}>
      {formatted}
      {showCurrency && <span className={styles.priceCurrency}>MXN</span>}
    </span>
  );
}

// Portado del prototipo funcional -progress/kno-react-common (codigo propio del ejecutor).
// Origen: kno-react-inputs/textarea (auto-resize + contador de caracteres).
// Se integra en el primitivo Field existente (modo textarea) en vez de crear un
// primitivo TextArea paralelo, para no duplicar label/error/hint (DRY).
function AutoTextarea({ autoResize = false, value, className, rows = 3, ...rest }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    if (!autoResize || !ref.current) return;
    const el = ref.current;
    el.style.height = 'auto';           // reset para medir el contenido real
    el.style.height = `${el.scrollHeight}px`;
  }, [autoResize, value]);
  return (
    <textarea ref={ref} value={value} className={className} rows={rows} {...rest} />
  );
}

export function Field({
  label, name, value, onChange,
  placeholder = '', type = 'text', textarea = false,
  required = false, error = null,
  hint = null,
  autoComplete,
  autoResize = false,
  showCount = false,
  maxLength,
  ...rest
}) {
  const inputClass = cx(styles.fieldInput, error && styles.fieldInputError);
  const len = (value || '').length;
  // El contador se muestra si se pide explicitamente o si hay un maxLength.
  const withCount = textarea && (showCount || maxLength != null);

  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      {textarea ? (
        <AutoTextarea
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={inputClass}
          maxLength={maxLength}
          autoResize={autoResize}
          {...rest}
        />
      ) : (
        <input
          name={name}
          value={value || ''}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={inputClass}
          autoComplete={autoComplete}
          type={type}
          maxLength={maxLength}
          {...rest}
        />
      )}
      {withCount && (
        <span className={styles.fieldCount}>
          {maxLength != null ? `${len}/${maxLength}` : len}
        </span>
      )}
      {error && <span className={styles.fieldError}>{error}</span>}
      {!error && hint && <span className={styles.fieldHint}>{hint}</span>}
    </label>
  );
}

export function Button({
  children, variant = 'primary', size = 'md', block = false,
  type = 'button', onClick, disabled = false, ...rest
}) {
  const cls = cx(
    styles.btn,
    styles[`btn_${variant}`],
    styles[`btn_${size}`],
    block && styles.btnBlock,
  );

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} {...rest}>
      {children}
    </button>
  );
}

export function SumRow({ label, value, tone = 'default', muted = false }) {
  const toneClass = {
    default: styles.sumRowDefault,
    lime:    styles.sumRowLime,
    bronze:  styles.sumRowBronze,
    muted:   styles.sumRowMuted,
  }[tone];

  return (
    <div className={`${styles.sumRow} ${muted ? styles.sumRowSmall : ''}`}>
      <span>{label}</span>
      <span className={`${styles.sumRowValue} ${toneClass}`}>{value}</span>
    </div>
  );
}

export function EmptyState({ icon = '◯', title, description, children }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <h2 className={styles.emptyTitle}>{title}</h2>
      {description && <p className={styles.emptyDesc}>{description}</p>}
      {children && <div className={styles.emptyActions}>{children}</div>}
    </div>
  );
}
