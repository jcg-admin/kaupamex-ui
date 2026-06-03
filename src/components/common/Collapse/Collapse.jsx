// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Collapse/Collapse.jsx
/**
 * Collapse — ecommerce-ui
 * Sección colapsable con API completa de ui-core-5.25.0 collapse.js.
 *
 * Opciones:
 *   toggle: true  — abre/cierra al crear (default ui-core)
 *   parent: null  — selector del accordeon padre (solo uno abierto a la vez)
 *
 * Métodos via ref: toggle() / show() / hide() / dispose()
 * Eventos: onShow / onShown / onHide / onHidden
 */
import {
  useState, useCallback,
  useImperativeHandle, forwardRef, useId,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Collapse.module.scss';

const Collapse = forwardRef(function Collapse({
  children,
  trigger,        // Elemento trigger (si no se pasa, solo ref)
  open: controlled,
  defaultOpen = false,
  // Opciones de ui-core
  toggle: toggleOnMount = false, // toggle:true en ui-core = mostrar al crear si data-toggle
  parent,         // selector de accordeon (sin uso directo aquí — ver Accordion)
  horizontal = false, // colapso horizontal en lugar de vertical
  // Eventos
  onShow,
  onShown,
  onHide,
  onHidden,
  className = '',
}, ref) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const id = useId();
  const collapseId = `collapse-${id.replace(/:/g, '')}`;

  const isOpen = controlled !== undefined ? controlled : internalOpen;

  // show() — equivale a Collapse.show() de ui-core
  const show = useCallback(() => {
    if (controlled === undefined) setInternalOpen(true);
    onShow?.();
    setTimeout(() => onShown?.(), 350); // duración de la animación
  }, [controlled, onShow, onShown]);

  // hide() — equivale a Collapse.hide() de ui-core
  const hide = useCallback(() => {
    if (controlled === undefined) setInternalOpen(false);
    onHide?.();
    setTimeout(() => onHidden?.(), 350);
  }, [controlled, onHide, onHidden]);

  // toggle() — equivale a Collapse.toggle() de ui-core
  const toggleFn = useCallback(() => isOpen ? hide() : show(), [isOpen, hide, show]);
  const dispose  = useCallback(() => hide(), [hide]);

  useImperativeHandle(ref, () => ({
    toggle: toggleFn, show, hide, dispose,
    isShown: () => isOpen,
  }), [toggleFn, show, hide, dispose, isOpen]);

  const animationAxis = horizontal
    ? { initial: { width: 0, opacity: 0 }, animate: { width: 'auto', opacity: 1 }, exit: { width: 0, opacity: 0 } }
    : { initial: { height: 0, opacity: 0 }, animate: { height: 'auto', opacity: 1 }, exit: { height: 0, opacity: 0 } };

  return (
    <div className={`${styles.collapse} ${className}`}>
      {trigger && (
        <button
          type="button"
          className={styles.trigger}
          onClick={toggleFn}
          aria-expanded={isOpen}
          aria-controls={collapseId}
        >
          {trigger}
        </button>
      )}

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={collapseId}
            className={`${styles.content} ${horizontal ? styles.horizontal : ''}`}
            {...animationAxis}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default Collapse;
export { Collapse };
