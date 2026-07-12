// Adaptado de @progress/kno-react-buttons (Toolbar) — referencia no runtime.
// Reimplementacion nativa: contenedor role="toolbar" con *roving tabindex* y
// navegacion por teclado (ArrowLeft/Right/Home/End) sobre sus controles
// focusables, cumpliendo el patron WAI-ARIA APG (cierra H-UI-BTN-01). Envuelve
// controles arbitrarios (Button, etc.) sin cambiar su contrato.
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './Toolbar.module.scss';

const FOCUSABLE = 'button, a[href], input, select, textarea, [tabindex]';

export default function Toolbar({ children, ariaLabel, className, ...rest }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);

  const items = useCallback(() => {
    if (!ref.current) return [];
    return Array.from(ref.current.querySelectorAll(FOCUSABLE))
      .filter((el) => !el.disabled && el.getAttribute('aria-hidden') !== 'true');
  }, []);

  // Roving tabindex: solo el control activo es tabbable (un unico tab stop).
  useEffect(() => {
    const els = items();
    els.forEach((el, i) => { el.tabIndex = i === active ? 0 : -1; });
  }, [active, items, children]);

  const onKeyDown = (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    const els = items();
    if (els.length === 0) return;
    const idx = els.indexOf(document.activeElement);
    if (idx < 0) return;
    e.preventDefault();
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % els.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + els.length) % els.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = els.length - 1;
    setActive(next);
    els[next].focus();
  };

  const onFocus = (e) => {
    const idx = items().indexOf(e.target);
    if (idx >= 0 && idx !== active) setActive(idx);
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      className={[styles.toolbar, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
