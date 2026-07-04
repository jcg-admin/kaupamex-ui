// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Alert/Alert.jsx
/**
 * Alert — ecommerce-ui
 * Mensaje inline persistente con cierre animado.
 *
 * Lógica completa de ui-core alert.js:
 *   - Variantes: success, danger/error, warning, info, neutral
 *   - Dismissible: botón ✕ con animación fade (CSS transition)
 *   - onClose: callback antes de cerrar (cancelable)
 *   - onClosed: callback tras cerrar (como EVENT_CLOSED en ui-core)
 *   - Auto-dismiss con timeout configurable
 *   - AnimatePresence (framer-motion) para la salida
 *
 * Referencia: ui-core-5.25.0 alert.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 *
 * @param {string}   variant     — 'success'|'danger'|'warning'|'info'|'neutral'
 * @param {boolean}  dismissible — muestra botón de cierre
 * @param {Function} onClose     — antes de cerrar (puede devolver false para cancelar)
 * @param {Function} onClosed    — después de cerrar (equivalente a EVENT_CLOSED)
 * @param {number}   timeout     — ms para auto-cierre (0 = desactivado)
 * @param {ReactNode} icon       — icono opcional en el lado izquierdo
 * @param {string}   title       — título en negrita (opcional)
 * @param {ReactNode} children   — contenido
 */
import { useState, useEffect, useCallback, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Icon from '@components/common/Icon/Icon';
import styles from './Alert.module.scss';

// Nombres de icono SVG (Icon component) por variante — reemplaza los glifos
// de texto (✓ ✕ ⚠ ℹ) por SVG inline. `neutral` no lleva icono.
const DEFAULT_ICON_NAMES = {
  success: 'check',
  danger:  'warning',
  error:   'warning',
  warning: 'warning',
  info:    'info',
};

export default function Alert({
  variant      = 'info',
  dismissible  = false,
  onClose,
  onClosed,
  timeout      = 0,
  icon,
  title,
  children,
  className    = '',
}) {
  const [visible, setVisible] = useState(true);
  const id = useId();

  // Auto-dismiss (equivalente a Default.timeout en ui-core loading-button)
  useEffect(() => {
    if (!timeout) return;
    const t = setTimeout(() => handleClose(), timeout);
    return () => clearTimeout(t);
  }, [timeout]); // eslint-disable-line

  const handleClose = useCallback(() => {
    // Equivalente a close() de ui-core — permite cancelar (closeEvent.defaultPrevented)
    if (onClose) {
      const result = onClose();
      if (result === false) return;  // cancelado
    }
    setVisible(false);
  }, [onClose]);

  const handleExitComplete = useCallback(() => {
    // Equivalente a EVENT_CLOSED — se dispara tras la animación de salida
    onClosed?.();
  }, [onClosed]);

  // `icon` prop (ReactNode) tiene prioridad; si no, se resuelve el SVG por variante.
  const iconName = DEFAULT_ICON_NAMES[variant];
  const resolvedIcon = icon !== undefined
    ? icon
    : (iconName ? <Icon name={iconName} size={18} /> : null);

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          role="alert"
          aria-labelledby={title ? `${id}-title` : undefined}
          aria-live={variant === 'danger' || variant === 'error' ? 'assertive' : 'polite'}
          className={`${styles.alert} ${styles[`alert--${variant}`]} ${className}`}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
        >
          {resolvedIcon && (
            <span className={styles.icon} aria-hidden="true">{resolvedIcon}</span>
          )}

          <div className={styles.body}>
            {title && (
              <strong id={`${id}-title`} className={styles.title}>{title}</strong>
            )}
            <div className={styles.content}>{children}</div>
          </div>

          {dismissible && (
            <button
              type="button"
              className={styles.close}
              onClick={handleClose}
              aria-label="Cerrar alerta"
            >
              <Icon name="x" size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export { Alert };
