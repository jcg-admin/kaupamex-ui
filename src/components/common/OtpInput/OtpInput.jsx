import { useId, useRef } from 'react';
import styles from './OtpInput.module.scss';

export default function OtpInput({
  length = 6,
  value = '',
  onChange,
  autoFocus = false,
  disabled = false,
  masked = false,
  name,
  'aria-label': ariaLabel = 'Codigo de verificacion',
}) {
  const rootId = useId();
  const inputRefs = useRef([]);
  const advancingTo = useRef(-1);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function focusAt(index) {
    if (index >= 0 && index < length) {
      advancingTo.current = index;
      inputRefs.current[index]?.focus();
    }
  }

  function handleChange(e, i) {
    const raw = e.target.value;
    if (!raw) {
      const next = [...digits];
      next[i] = '';
      onChange?.(next.join(''));
      return;
    }
    const stripped = raw.replace(digits[i], '').replace(/\D/g, '').slice(-1);
    if (!stripped) return;
    const next = [...digits];
    next[i] = stripped;
    onChange?.(next.join(''));
    focusAt(i + 1);
  }

  function handleKeyDown(e, i) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (digits[i]) {
        const next = [...digits];
        next[i] = '';
        onChange?.(next.join(''));
      } else {
        focusAt(i - 1);
        if (i > 0) {
          const next = [...digits];
          next[i - 1] = '';
          onChange?.(next.join(''));
        }
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(i - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(i + 1);
    }
  }

  function handlePaste(e, startIdx) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    const next = [...digits];
    for (let k = 0; k < pasted.length && startIdx + k < length; k++) {
      next[startIdx + k] = pasted[k];
    }
    onChange?.(next.join(''));
    focusAt(Math.min(startIdx + pasted.length, length - 1));
  }

  function handleFocus(e, i) {
    if (advancingTo.current === i) {
      advancingTo.current = -1;
      e.target.select();
      return;
    }
    advancingTo.current = -1;
    const firstEmpty = digits.findIndex(d => !d);
    if (firstEmpty >= 0 && firstEmpty < i) {
      inputRefs.current[firstEmpty]?.focus();
    } else {
      e.target.select();
    }
  }

  return (
    <div className={styles.root} role="group" aria-label={ariaLabel}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={el => { inputRefs.current[i] = el; }}
          id={`${rootId}-${i}`}
          type={masked ? 'password' : 'text'}
          inputMode="numeric"
          pattern="[0-9]*"
          value={digit}
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          aria-label={`Digito ${i + 1} de ${length}`}
          className={`${styles.cell} ${digit ? styles.filled : ''}`}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onPaste={(e) => handlePaste(e, i)}
          onFocus={(e) => handleFocus(e, i)}
        />
      ))}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
