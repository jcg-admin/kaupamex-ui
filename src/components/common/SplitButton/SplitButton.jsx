// Adaptado de @progress/kno-react-buttons (SplitButton) — referencia no runtime.
// Reimplementacion nativa: accion primaria + menu de acciones secundarias.
// Items via `items=[{text, onClick|href}]` (soporta accion o descarga). Widget
// compuesto: la accion primaria reenvia su onClick nativo; cada item invoca su
// propio onClick o navega por href.
import { useEffect, useId, useRef, useState } from 'react';
import styles from './SplitButton.module.scss';

export default function SplitButton({
  text,
  onClick,
  items = [],
  disabled = false,
  ariaLabel,
  className,
  ...rest
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDocMouseDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={[styles.wrap, className].filter(Boolean).join(' ')} {...rest}>
      <button type="button" className={styles.main} onClick={onClick} disabled={disabled}>
        {text}
      </button>
      <button
        type="button"
        className={styles.toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel ?? 'Más acciones'}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul id={menuId} role="menu" className={styles.menu}>
          {items.map((it, i) => (
            <li role="none" key={it.text ?? i}>
              {it.href ? (
                <a
                  role="menuitem"
                  href={it.href}
                  download={it.download}
                  className={styles.item}
                  onClick={() => setOpen(false)}
                >
                  {it.text}
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className={styles.item}
                  onClick={() => { it.onClick?.(); setOpen(false); }}
                >
                  {it.text}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
