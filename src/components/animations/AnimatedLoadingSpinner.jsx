/**
 * AnimatedLoadingSpinner -- PracticaYoruba
 * Spinner con animacion para estados de carga inline.
 */

import styles from './AnimatedLoadingSpinner.module.scss';

export default function AnimatedLoadingSpinner({ size = 'md', className = '' }) {
  return (
    <div
      className={`${styles.spinner} ${styles[`spinner--${size}`]} ${className}`}
      role="status"
      aria-label="Cargando"
    />
  );
}
