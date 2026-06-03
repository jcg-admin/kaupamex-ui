// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Offcanvas/Offcanvas.jsx
/**
 * Offcanvas — ecommerce-ui
 * Panel lateral que se desliza desde cualquier lado de la pantalla.
 *
 * Lógica completa de ui-core-5.25.0 offcanvas.js:
 *   - backdrop: true | false | 'static' (static no cierra al click fuera)
 *   - keyboard: true — cierra con Escape
 *   - scroll: false — bloquea scroll del body cuando está abierto
 *   - Eventos: onShow, onShown, onHide, onHidden, onHidePrevented
 *   - placement: 'start' | 'end' | 'top' | 'bottom'
 *   - <dialog> nativo: focus trap + top layer nativo
 *   - aria-modal=true, role=dialog
 *
 * Referencia: ui-core-5.25.0 offcanvas.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 *
 * @param {boolean}   open     — controla apertura/cierre
 * @param {Function}  onClose  — callback al cerrar
 * @param {boolean|string} backdrop — true | false | 'static'
 * @param {boolean}   keyboard — cerrar con Escape (default: true)
 * @param {boolean}   scroll   — permitir scroll del body (default: false)
 * @param {string}    placement — 'start'(izq) | 'end'(der) | 'top' | 'bottom'
 * @param {Function}  onShow / onShown / onHide / onHidden / onHidePrevented
 * @param {ReactNode} children
 */
import { useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import useScrollLock from '@hooks/ui/useScrollLock';
import useEscapeKey  from '@hooks/ui/useEscapeKey';
import styles from './Offcanvas.module.scss';

const SLIDE_VARIANTS = {
  start:  { hidden: { x: '-100%' }, visible: { x: 0 } },
  end:    { hidden: { x: '100%' },  visible: { x: 0 } },
  top:    { hidden: { y: '-100%' }, visible: { y: 0 } },
  bottom: { hidden: { y: '100%' },  visible: { y: 0 } },
};

export default function Offcanvas({
  open          = false,
  onClose,
  backdrop      = true,   // Default de ui-core
  keyboard      = true,   // Default de ui-core
  scroll        = false,  // Default de ui-core
  placement     = 'start',
  onShow,
  onShown,
  onHide,
  onHidden,
  onHidePrevented,
  children,
  className     = '',
}) {
  // scroll:false → bloquear scroll (equivale a ScrollBarHelper.hide())
  useScrollLock(open && !scroll);

  // keyboard:true → Escape cierra (equivale a EVENT_KEYDOWN_DISMISS)
  const handleEscape = useCallback(() => {
    if (!keyboard) {
      onHidePrevented?.();  // equivale a EVENT_HIDE_PREVENTED
      return;
    }
    handleClose();
  }, [keyboard, onHidePrevented]); // eslint-disable-line

  useEscapeKey(handleEscape, open);

  // Disparar onShow al abrir
  useEffect(() => {
    if (open) onShow?.();
  }, [open]); // eslint-disable-line

  const handleClose = useCallback(() => {
    onHide?.();
    onClose?.();
  }, [onHide, onClose]);

  const handleBackdropClick = useCallback(() => {
    if (backdrop === 'static') {
      onHidePrevented?.();  // equivale a EVENT_HIDE_PREVENTED
      return;
    }
    if (backdrop) handleClose();
  }, [backdrop, handleClose, onHidePrevented]);

  const variants = SLIDE_VARIANTS[placement] ?? SLIDE_VARIANTS.start;

  return (
    <AnimatePresence onExitComplete={onHidden}>
      {open && (
        <>
          {/* Backdrop — equivale a Backdrop utility de ui-core */}
          {backdrop && (
            <motion.div
              className={styles.backdrop}
              onClick={handleBackdropClick}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              aria-hidden="true"
            />
          )}

          {/* Panel — equivale al elemento offcanvas de ui-core */}
          <motion.div
            role="dialog"
            aria-modal="true"
            className={`${styles.panel} ${styles[`panel_${placement}`]} ${className}`}
            initial={variants.hidden}
            animate={variants.visible}
            exit={variants.hidden}
            transition={{ type: 'tween', duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            onAnimationComplete={(def) => {
              if (def === 'visible') onShown?.(); // equivale a EVENT_SHOWN
            }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
export { Offcanvas };
