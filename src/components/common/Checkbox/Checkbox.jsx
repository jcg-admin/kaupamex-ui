// Adaptado de @progress/kno-react-inputs (Checkbox) — referencia no runtime.
// Reimplementacion nativa: <input type="checkbox"> real (semantica de
// formulario preservada) con label enlazado, soporte indeterminate y a11y
// (aria-invalid/aria-describedby). Preserva la superficie de props relevante
// (checked/defaultChecked/disabled/label/value/name/indeterminate). onChange
// reenvia el evento nativo del <input>, asi el consumidor usa e.target.checked
// sin cambiar su handler.
import { useEffect, useId, useRef } from 'react';
import styles from './Checkbox.module.scss';

export default function Checkbox({
  checked,
  defaultChecked,
  disabled = false,
  id,
  name,
  value,
  label,
  indeterminate = false,
  error = null,
  onChange,
  ariaLabel,
  ariaDescribedBy,
  className,
  ...rest
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(indeterminate);
  }, [indeterminate]);

  const handleChange = (e) => {
    if (disabled) return;
    onChange?.(e);
  };

  return (
    <span className={[styles.wrapper, disabled && styles.disabled, className].filter(Boolean).join(' ')}>
      <input
        ref={ref}
        type="checkbox"
        id={inputId}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={handleChange}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={ariaDescribedBy}
        className={[styles.input, error && styles.invalid].filter(Boolean).join(' ')}
        {...rest}
      />
      {label && <label htmlFor={inputId} className={styles.label}>{label}</label>}
    </span>
  );
}
