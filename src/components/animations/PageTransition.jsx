/**
 * PageTransition -- PracticaYoruba
 * Envuelve el contenido de una pagina con una animacion fade-in suave.
 * Usado en los layouts para transiciones entre rutas.
 */

import styles from './PageTransition.module.scss';

export default function PageTransition({ children, className = '' }) {
  return (
    <div className={`${styles.transition} ${className}`}>
      {children}
    </div>
  );
}
