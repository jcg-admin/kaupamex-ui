// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Chip/Chip.jsx
/**
 * Chip — ecommerce-ui
 * Etiqueta interactiva: seleccionable, removible o solo informativa.
 *
 * Lógica completa de ui-core-5.25.0 chip.js:
 *   - selectable: permite toggle activo/inactivo con aria-selected
 *   - removable: muestra botón × con aria-label configurable
 *   - disabled: no responde a interacciones
 *   - selected: estado inicial
 *   - onSelect / onDeselect / onRemove (cancelables: devolver false previene)
 *   - Teclado: Space/Enter para toggle, Backspace/Delete para remove
 *   - Animación de salida con framer-motion (como CLASS_NAME_HIDING en ui-core)
 *
 * Referencia: ui-core-5.25.0 chip.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { useState, useCallback, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Chip.module.scss';

const REMOVE_ICON = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <line x1="4" y1="4" x2="12" y2="12"/>
    <line x1="12" y1="4" x2="4" y2="12"/>
  </svg>
);

export default function Chip({
  children,
  selectable     = false,  // Default de ui-core
  removable      = false,  // Default de ui-core
  selected:      initSelected = false,
  disabled       = false,  // Default de ui-core
  onSelect,
  onDeselect,
  onRemove,
  ariaRemoveLabel = 'Eliminar',  // Default de ui-core (ariaRemoveLabel)
  removeIcon     = REMOVE_ICON,
  className      = '',
}) {
  const [isSelected, setIsSelected] = useState(initSelected);
  const [exists, setExists]         = useState(true);
  const id = useId();

  // toggle() — equivale a toggle() de ui-core
  const toggle = useCallback(() => {
    if (!selectable || disabled) return;
    if (isSelected) {
      const result = onDeselect?.();
      if (result === false) return;  // equivale a EVENT_DESELECT.defaultPrevented
      setIsSelected(false);
    } else {
      const result = onSelect?.();
      if (result === false) return;  // equivale a EVENT_SELECT.defaultPrevented
      setIsSelected(true);
    }
  }, [selectable, disabled, isSelected, onSelect, onDeselect]);

  // remove() — equivale a remove() de ui-core
  const remove = useCallback((e) => {
    e?.stopPropagation();
    const result = onRemove?.();
    if (result === false) return;  // equivale a EVENT_REMOVE.defaultPrevented
    setExists(false);
  }, [onRemove]);

  // Teclado — equivale a _addEventListeners en ui-core
  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    if ((e.key === ' ' || e.key === 'Enter') && selectable) {
      e.preventDefault();
      toggle();
    }
    if ((e.key === 'Backspace' || e.key === 'Delete') && removable) {
      remove();
    }
  }, [disabled, selectable, removable, toggle, remove]);

  const cls = [
    styles.chip,
    selectable && styles.chipSelectable,
    isSelected && styles.chipSelected,
    disabled && styles.chipDisabled,
    className,
  ].filter(Boolean).join(' ');

  return (
    <AnimatePresence>
      {exists && (
        <motion.span
          role={selectable ? 'option' : 'status'}
          aria-selected={selectable ? isSelected : undefined}
          aria-disabled={disabled ? true : undefined}
          tabIndex={disabled ? undefined : (selectable || removable ? 0 : undefined)}
          className={cls}
          onClick={selectable ? toggle : undefined}
          onKeyDown={handleKeyDown}
          initial={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.15 }}
        >
          <span className={styles.label}>{children}</span>

          {removable && (
            <button
              type="button"
              className={styles.removeBtn}
              onClick={remove}
              aria-label={`${ariaRemoveLabel} ${typeof children === 'string' ? children : ''}`}
              tabIndex={-1}
              disabled={disabled}
            >
              {removeIcon}
            </button>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
export { Chip };
