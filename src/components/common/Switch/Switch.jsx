// Adaptado de @progress/kno-react-inputs (Switch) — referencia no runtime.
// Reimplementacion nativa del contrato publico: toggle booleano accesible
// (WAI-ARIA switch pattern via <button role="switch" aria-checked>).
// Preserva la superficie de props relevante (checked/defaultChecked/disabled/
// size/onLabel/offLabel/onChange) adaptando onChange a un booleano ergonomico
// en vez del SwitchChangeEvent del paquete original.
import { useId, useState } from 'react';
import styles from './Switch.module.scss';

const SIZES = { small: styles.sm, medium: styles.md, large: styles.lg };

export default function Switch({
  checked,
  defaultChecked = false,
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
  const isControlled = checked !== undefined;
  const [internal, setInternal] = useState(defaultChecked);
  const value = isControlled ? checked : internal;

  const toggle = () => {
    if (disabled) return;
    const next = !value;
    if (!isControlled) setInternal(next);
    onChange?.(next);
  };

  const sizeClass = SIZES[size] ?? styles.md;
  const stateLabel = value ? onLabel : offLabel;

  return (
    <span className={[styles.wrapper, className].filter(Boolean).join(' ')}>
      {label && <span id={`${switchId}-label`} className={styles.text}>{label}</span>}
      <button
        type="button"
        role="switch"
        id={switchId}
        name={name}
        aria-checked={value}
        aria-label={ariaLabel}
        aria-labelledby={label ? `${switchId}-label` : undefined}
        aria-describedby={ariaDescribedBy}
        disabled={disabled}
        onClick={toggle}
        className={[styles.track, sizeClass, value && styles.on].filter(Boolean).join(' ')}
        {...rest}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
      {stateLabel != null && <span className={styles.stateLabel} aria-hidden="true">{stateLabel}</span>}
    </span>
  );
}
