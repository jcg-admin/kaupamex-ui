// Adaptado de @progress/kno-react-inputs (MaskedTextBox) — referencia no
// runtime. Reimplementacion nativa: <input> con mascara por tokens. onChange
// reenvia un evento con la misma forma nativa (target.value ya enmascarado),
// asi el consumidor usa e.target.value sin cambiar su handler.
//   Tokens de mascara: 0/9/# = digito · a = letra · * = alfanumerico · resto = literal.
import { useId } from 'react';
import styles from './MaskedTextBox.module.scss';

const TOKENS = { 0: /\d/, 9: /\d/, '#': /\d/, a: /[a-zA-Z]/, '*': /[a-zA-Z0-9]/ };

export function applyMask(raw, mask) {
  const src = String(raw ?? '');
  let out = '';
  let ri = 0;
  for (let mi = 0; mi < mask.length && ri <= src.length; mi += 1) {
    const mc = mask[mi];
    const rule = TOKENS[mc];
    if (rule) {
      let matched = false;
      while (ri < src.length) {
        const c = src[ri];
        ri += 1;
        if (rule.test(c)) { out += c; matched = true; break; }
      }
      if (!matched) break;
    } else {
      out += mc;                 // literal fijo
      if (src[ri] === mc) ri += 1; // el usuario ya lo tecleo
    }
  }
  return out;
}

export default function MaskedTextBox({
  mask = '',
  value = '',
  disabled = false,
  placeholder,
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

  const handleChange = (e) => {
    const masked = mask ? applyMask(e.target.value, mask) : e.target.value;
    onChange?.({ target: { value: masked, name }, nativeEvent: e.nativeEvent });
  };

  return (
    <input
      type="text"
      inputMode={/^[09#]/.test(mask) ? 'numeric' : undefined}
      id={inputId}
      name={name}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={handleChange}
      aria-label={ariaLabel}
      aria-invalid={error ? true : undefined}
      aria-describedby={ariaDescribedBy}
      className={[styles.input, error && styles.invalid, className].filter(Boolean).join(' ')}
      {...rest}
    />
  );
}
