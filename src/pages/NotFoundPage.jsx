/**
 * NotFoundPage — Práctica Yorùbà
 * 404 con tipografía grande del código en lima + CTAs.
 */

import { Link } from 'react-router-dom';
import { MetaTag, Button } from '@components/common/primitives';
import styles from './NotFoundPage.module.scss';

export default function NotFoundPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.code} aria-hidden="true">404</div>
        <MetaTag tone="bronze">Página no encontrada</MetaTag>
        <h1 className={styles.title}>
          Esta página <em>no existe</em>
        </h1>
        <p className={styles.lead}>
          La dirección que buscas no está en la casa. Quizás el enlace se rompió
          o la página fue removida.
        </p>
        <div className={styles.ctas}>
          <Link to="/"><Button variant="primary" size="lg">Ir al catálogo</Button></Link>
          <Link to="/catalog?cat=por-orisha"><Button variant="secondary" size="lg">Buscar por òrìsà</Button></Link>
        </div>
      </div>
    </main>
  );
}
