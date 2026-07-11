// Adaptado de @progress/kno-react-inputs (Switch) — referencia no runtime.
// Reimplementacion nativa: <input type="checkbox" role="switch"> real (drop-in
// del checkbox que reemplaza) estilizado como toggle. onChange reenvia el
// evento de cambio del <input>, asi el consumidor usa e.target.checked sin
// cambiar su handler (regla adaptacion-componentes-nativa: preservar el
// contrato publico). Preserva la superficie de props relevante
// (checked/defaultChecked/disabled/size/onLabel/offLabel).
import { useId } from 'react';
import styles from './Switch.module.scss';

const SIZES = { small: styles.sm, medium: styles.md, large: styles.lg };

export default function Switch({
  checked,
  defaultChecked,
  disabled = false,
  id,
  name,
  size = 'medium',
  onChange,
  onLabel,
  offLabel,
  label,
  ariaLabel,
  ariaDescribedBy,
  className,
  ...rest
}) {
  const autoId = useId();
  const switchId = id ?? autoId;
  const sizeClass = SIZES[size] ?? styles.md;

  return (
    <span className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && <label htmlFor={switchId} className={styles.text}>{label}</label>}
      <span className={[styles.control, sizeClass, disabled && styles.disabled].filter(Boolean).join(' ')}>
        <input
          type="checkbox"
          role="switch"
          id={switchId}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={onChange}
          aria-label={ariaLabel}
          aria-describedby={ariaDescribedBy}
          className={styles.input}
          {...rest}
        />
        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>
      </span>
      {(onLabel != null || offLabel != null) && (
        <span className={styles.stateLabel} aria-hidden="true">
          {checked ? onLabel : offLabel}
        </span>
      )}
    </span>
  );
}
