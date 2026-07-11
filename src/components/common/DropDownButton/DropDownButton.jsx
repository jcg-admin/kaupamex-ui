// Adaptado de @progress/kno-react-buttons (DropDownButton) — referencia no
// runtime. Reimplementacion nativa: boton disparador + menu de acciones, SIN
// accion por defecto (a diferencia de SplitButton, que si tiene un boton
// primario). Contrato: `text` y/o `icon` para el disparador, `items=[{text,
// onClick|href, download, danger}]`, `ariaLabel`. Patron de popup (role=menu +
// Escape + cierre por click-fuera) equivalente al de SplitButton.
import { useEffect, useId, useRef, useState } from 'react';
import styles from './DropDownButton.module.scss';

export default function DropDownButton({
  text,
  icon,
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
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
      >
        {icon}
        {text ? <span className={styles.text}>{text}</span> : null}
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
                  className={[styles.item, it.danger && styles.danger].filter(Boolean).join(' ')}
                  onClick={() => setOpen(false)}
                >
                  {it.text}
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  className={[styles.item, it.danger && styles.danger].filter(Boolean).join(' ')}
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
