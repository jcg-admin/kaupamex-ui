// Adaptado de @progress/kno-react-inputs (NumericTextBox) — referencia no
// runtime. Reimplementacion nativa: <input type="number"> real con spinners
// opcionales y clamp a [min,max]. Preserva el contrato de un input numerico
// nativo: onChange reenvia el evento de cambio del <input>, asi el consumidor
// usa `e.target.value` (o Number(e.target.value)) sin cambiar su handler. Los
// spinners emiten un evento sintetico con la misma forma (target.value).
import { useId } from 'react';
import styles from './NumericTextBox.module.scss';

const clamp = (n, min, max) => {
  let v = n;
  if (min != null && v < min) v = min;
  if (max != null && v > max) v = max;
  return v;
};

export default function NumericTextBox({
  value,
  min,
  max,
  step = 1,
  disabled = false,
  placeholder,
  spinners = true,
  id,
  name,
  error = null,
  onChange,
  ariaLabel,
  ariaDescribedBy,
  className,
  ...rest
}) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const stepBy = (dir) => {
    if (disabled) return;
    const base = value === '' || value == null ? 0 : Number(value);
    const next = clamp((Number.isNaN(base) ? 0 : base) + dir * step, min, max);
    // Evento sintetico con la misma forma que el nativo (target.value string).
    onChange?.({ target: { value: String(next), name, type: 'number' } });
  };

  return (
    <span className={[styles.wrapper, disabled && styles.disabled, error && styles.invalid, className]
      .filter(Boolean).join(' ')}>
      <input
        type="number"
        inputMode="decimal"
        id={inputId}
        name={name}
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        placeholder={placeholder}
        onChange={onChange}
        aria-label={ariaLabel}
        aria-invalid={error ? true : undefined}
        aria-describedby={ariaDescribedBy}
        className={styles.input}
        {...rest}
      />
      {spinners && (
        <span className={styles.spinners} aria-hidden="true">
          <button type="button" tabIndex={-1} disabled={disabled}
            className={styles.spin} onClick={() => stepBy(1)}>▲</button>
          <button type="button" tabIndex={-1} disabled={disabled}
            className={styles.spin} onClick={() => stepBy(-1)}>▼</button>
        </span>
      )}
    </span>
  );
}
