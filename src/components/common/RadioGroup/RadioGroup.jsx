// Adaptado de @progress/kno-react-inputs (RadioGroup/RadioButton) — referencia
// no runtime. Reimplementacion nativa: grupo de <input type="radio"> reales
// (semantica de formulario) bajo role="radiogroup". Preserva el contrato de un
// grupo de radios nativo: onChange recibe el evento de cambio del <input>, asi
// el consumidor usa `e.target.value` sin cambiar su handler.
import { useId, useState } from 'react';
import styles from './RadioGroup.module.scss';

export default function RadioGroup({
  data = [],
  value,
  defaultValue,
  name,
  layout = 'vertical',
  disabled = false,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  className,
  ...rest
}) {
  const autoName = useId();
  const groupName = name ?? autoName;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const selected = isControlled ? value : internal;

  const handleChange = (e) => {
    if (disabled) return;
    if (!isControlled) setInternal(e.target.value);
    onChange?.(e);
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={[styles.group, layout === 'horizontal' && styles.horizontal, className]
        .filter(Boolean).join(' ')}
      {...rest}
    >
      {data.map((opt) => {
        const optDisabled = disabled || opt.disabled;
        return (
          <label
            key={String(opt.value)}
            className={[styles.option, optDisabled && styles.disabled].filter(Boolean).join(' ')}
          >
            <input
              type="radio"
              name={groupName}
              value={opt.value}
              checked={String(selected) === String(opt.value)}
              disabled={optDisabled}
              onChange={handleChange}
              className={styles.input}
            />
            <span className={styles.text}>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}
