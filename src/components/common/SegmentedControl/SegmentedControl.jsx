// Adaptado de @progress/kno-react-buttons (SegmentedControl) — referencia no
// runtime. Reimplementacion nativa: grupo de botones de seleccion unica
// (toggle-button group con aria-pressed) para filtros/conmutadores de vista.
// Preserva la superficie relevante (data/value/defaultValue/size/disabled)
// con onChange(value) — convencion de widget compuesto, no de <input> nativo.
import { useId, useState } from 'react';
import styles from './SegmentedControl.module.scss';

const SIZES = { small: styles.sm, medium: styles.md, large: styles.lg };

export default function SegmentedControl({
  data = [],
  value,
  defaultValue,
  size = 'medium',
  disabled = false,
  onChange,
  ariaLabel,
  className,
  ...rest
}) {
  const groupId = useId();
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? data[0]?.value);
  const selected = isControlled ? value : internal;
  const sizeClass = SIZES[size] ?? styles.md;

  const select = (v) => {
    if (disabled) return;
    if (!isControlled) setInternal(v);
    onChange?.(v);
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={[styles.group, sizeClass, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {data.map((opt) => {
        const active = selected === opt.value;
        const optDisabled = disabled || opt.disabled;
        return (
          <button
            key={String(opt.value)}
            type="button"
            aria-pressed={active}
            disabled={optDisabled}
            className={[styles.item, active && styles.active].filter(Boolean).join(' ')}
            onClick={() => select(opt.value)}
            id={`${groupId}-${opt.value}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
