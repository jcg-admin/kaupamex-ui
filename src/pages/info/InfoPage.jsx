/**
 * InfoPage — Página de contenido informativo (/info/:slug)
 * Renderiza contenido estático desde content.js según el slug.
 * Sin autenticación requerida.
 */

import { useParams, Link } from 'react-router-dom';
import { getInfoContent } from './content';
import styles from './InfoPage.module.scss';

export default function InfoPage() {
  const { slug } = useParams();
  const page = getInfoContent(slug);

  if (!page) {
    return (
      <div className={styles.notFound}>
        <h1>Página no encontrada</h1>
        <p>La sección que buscas no existe.</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  }

  return (
    <article className={styles.page}>
      <div className={styles.inner}>
        <nav className={styles.breadcrumb}>
          <Link to="/">Inicio</Link>
          <span> / </span>
          <span>{page.title}</span>
        </nav>

        <h1 className={styles.title}>{page.title}</h1>

        <div className={styles.body}>
          {page.sections.map((sec, i) => (
            <section key={i} className={styles.section}>
              {sec.heading && (
                <h2 className={styles.heading}>{sec.heading}</h2>
              )}
              {sec.body.split('\n\n').map((para, j) => (
                <p key={j} className={styles.para}>
                  {para.split('\n').map((line, k) => (
                    <span key={k}>
                      {line}
                      {k < para.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className={styles.footer}>
          <Link to="/" className={styles.backLink}>&larr; Volver al inicio</Link>
        </div>
      </div>
    </article>
  );
}
