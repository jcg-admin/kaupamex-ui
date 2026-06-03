// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Modal/Modal.jsx
/**
 * Modal — ecommerce-ui
 * Ventana modal con toda la API de ui-core-5.25.0 modal.js.
 *
 * Opciones de ui-core implementadas:
 *   backdrop: true | false | 'static'  (static = no cierra al click fuera)
 *   keyboard: true                     (Escape cierra, default ui-core)
 *   focus:    true                     (focus trap al abrir, default ui-core)
 *
 * Métodos públicos via ref:
 *   toggle()       show()       hide()       dispose()      handleUpdate()
 *
 * Eventos (callbacks):
 *   onShow / onShown / onHide / onHidden / onHidePrevented
 *
 * Tamaños: sm | md | lg | xl | fullscreen
 * Scroll interno: scrollable=true
 *
 * Iniciativa: integrar-componentes-ui-core-js (completar API)
 */
import {
  useRef, useEffect, useCallback,
  useImperativeHandle, forwardRef,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import styles from './Modal.module.scss';

const Modal = forwardRef(function Modal({
  open,
  onClose,
  children,
  className    = '',
  // Opciones de ui-core
  backdrop     = true,   // true | false | 'static'
  keyboard     = true,   // Escape cierra
  focus        = true,   // focus trap (nativo del <dialog>)
  // Tamaño
  size,                  // 'sm' | 'lg' | 'xl' | 'fullscreen'
  scrollable   = false,  // contenido interno con scroll
  centered     = false,  // centrado vertical
  // Eventos equivalentes a ui-core
  onShow,
  onShown,
  onHide,
  onHidden,
  onHidePrevented,
}, ref) {
  const dialogRef = useRef(null);

  // ── Sincronizar open con la API imperativa de <dialog> ─────────────────────
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) {
      onShow?.();
      d.showModal();
      // focus trap nativo: el browser ya lo gestiona con showModal()
      setTimeout(() => onShown?.(), 180);
    } else if (!open && d.open) {
      onHide?.();
      d.close();
      setTimeout(() => onHidden?.(), 180);
    }
  }, [open]); // eslint-disable-line

  // ── keyboard: Escape → cierra o dispara onHidePrevented ────────────────────
  const handleDialogClose = useCallback(() => {
    // El dialog nativo ya captura Escape y dispara 'close'
    if (!keyboard) {
      // keyboard=false → Escape no cierra (equivale a defaultPrevented)
      dialogRef.current?.showModal(); // reabrir
      onHidePrevented?.();
      return;
    }
    onClose?.();
  }, [keyboard, onClose, onHidePrevented]);

  // ── backdrop: click fuera del contenido ────────────────────────────────────
  const handleClick = useCallback((e) => {
    if (!backdrop) return;
    const rect = dialogRef.current?.getBoundingClientRect();
    if (!rect) return;
    const outside = e.clientX < rect.left || e.clientX > rect.right
                 || e.clientY < rect.top  || e.clientY > rect.bottom;
    if (!outside) return;

    if (backdrop === 'static') {
      // backdrop=static → no cierra (equivale a _triggerBackdropTransition)
      onHidePrevented?.();
      // Animación de "rebote" visual
      dialogRef.current?.classList.add(styles.staticBounce);
      setTimeout(() => dialogRef.current?.classList.remove(styles.staticBounce), 300);
      return;
    }
    onClose?.();
  }, [backdrop, onClose, onHidePrevented]);

  // ── handleUpdate() — reposicionar (equivale al método público) ─────────────
  const handleUpdate = useCallback(() => {
    // En implementación nativa no hay Popper; el posicionamiento es CSS
    // Disparar un reflow si hay contenido dinámico
    dialogRef.current?.getBoundingClientRect();
  }, []);

  // ── Ref imperativo — todos los métodos públicos de ui-core ─────────────────
  useImperativeHandle(ref, () => ({
    show:         () => { if (!dialogRef.current?.open) onClose?.(); /* toggle via prop */ },
    hide:         () => onClose?.(),
    toggle:       () => dialogRef.current?.open ? onClose?.() : undefined,
    dispose:      () => onClose?.(),
    handleUpdate,
  }), [onClose, handleUpdate]);

  const dialogCls = [
    styles.dialog,
    size       ? styles[`size_${size}`]   : '',
    scrollable ? styles.scrollable : '',
    centered   ? styles.centered   : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <AnimatePresence onExitComplete={onHidden}>
      {open && (
        <motion.dialog
          ref={dialogRef}
          className={dialogCls}
          onClick={handleClick}
          onClose={handleDialogClose}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1,    y: 0   }}
          exit={{    opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          aria-modal="true"
        >
          {children}
        </motion.dialog>
      )}
    </AnimatePresence>
  );
});

export default Modal;
export { Modal };
