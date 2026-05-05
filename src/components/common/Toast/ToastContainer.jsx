/**
 * ToastContainer — PracticaYoruba
 * Renderiza las notificaciones toast del store.
 */

import { useDispatch, useSelector } from 'react-redux';
import { selectToasts } from '@redux/selectors';
import { removeToast } from '@redux/slices/uiSlice';
import styles from './ToastContainer.module.scss';

const ICONS = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'i',
};

export default function ToastContainer() {
  const dispatch = useDispatch();
  const toasts   = useSelector(selectToasts);

  if (!toasts.length) return null;

  return (
    <div className={styles.container} role="region" aria-label="Notificaciones" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${styles.toast} ${styles[`toast--${t.type}`]}`}>
          <span className={styles.icon}>{ICONS[t.type] ?? 'i'}</span>
          <div className={styles.body}>
            {t.title   && <p className={styles.title}>{t.title}</p>}
            {t.message && <p className={styles.message}>{t.message}</p>}
          </div>
          <button
            className={styles.close}
            onClick={() => dispatch(removeToast(t.id))}
            aria-label="Cerrar notificación"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
