/**
 * ToastContainer — Kaupamex
 * Renderiza las notificaciones toast del store.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectToasts } from '@redux/selectors';
import { removeToast } from '@redux/slices/uiSlice';
import { toReadableString } from '@utils/toReadableString';
import Icon from '@components/common/Icon/Icon';
import styles from './ToastContainer.module.scss';

// Nombres de icono SVG por tipo de toast (reemplazan los glifos ✓ ✕ ⚠ i).
const ICON_NAMES = {
  success: 'check',
  error:   'warning',
  warning: 'warning',
  info:    'info',
};

// Duración por defecto (ms) cuando el toast no la especifica. Coincide con
// ToastContext (4000). `duration === 0` deja el toast fijo hasta cerrarlo.
const DEFAULT_DURATION = 4000;

/**
 * ToastItem — un toast con auto-descarte propio.
 *
 * H-10: antes solo los toasts creados vía `useToast()` (ToastContext) se
 * auto-descartaban; los despachados directo con `dispatch(addToast(...))`
 * —p.ej. AddToWishlistButton— se quedaban fijos hasta que el usuario los
 * cerraba a mano. Al programar el descarte aquí, TODO toast desaparece solo
 * tras `duration` ms sin importar cómo se creó (fuente única de verdad).
 */
function ToastItem({ toast }) {
  const dispatch = useDispatch();
  const duration = toast.duration ?? DEFAULT_DURATION;

  useEffect(() => {
    if (duration === 0) return undefined;   // 0 = fijo (no auto-descartar)
    const timer = setTimeout(() => dispatch(removeToast(toast.id)), duration);
    return () => clearTimeout(timer);
  }, [dispatch, toast.id, duration]);

  // Defensa de última línea: title/message podrían no ser string (dict
  // de error DRF). Coercer a texto legible; si no aporta nada, omitir —
  // nunca pintar "[object Object]".
  const title   = toReadableString(toast.title, '');
  const message = toReadableString(toast.message, '');

  return (
    <div className={`${styles.toast} ${styles[`toast--${toast.type}`]}`}>
      <span className={styles.icon} aria-hidden="true">
        <Icon name={ICON_NAMES[toast.type] ?? 'info'} size={18} />
      </span>
      <div className={styles.body}>
        {title   && <p className={styles.title}>{title}</p>}
        {message && <p className={styles.message}>{message}</p>}
      </div>
      <button
        className={styles.close}
        onClick={() => dispatch(removeToast(toast.id))}
        aria-label="Cerrar notificación"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useSelector(selectToasts);

  if (!toasts.length) return null;

  return (
    <div className={styles.container} role="region" aria-label="Notificaciones" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
