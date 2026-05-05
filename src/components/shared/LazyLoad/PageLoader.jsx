/**
 * PageLoader — PracticaYoruba
 * Loader fullscreen para Suspense y rutas protegidas en carga.
 */

import styles from './PageLoader.module.scss';

export default function PageLoader({ message = 'Cargando...' }) {
  return (
    <div className={styles.wrapper} role="status" aria-label={message}>
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  );
}
