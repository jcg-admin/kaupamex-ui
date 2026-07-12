/**
 * InfoPage — Página de contenido informativo (/info/:slug)
 *
 * Fuente de contenido en dos capas (UC-CFG-04, H-UI-CFG04-01):
 *   1. API pública GET /api/v2/config/pages/<apiSlug>/ — para las páginas que
 *      el admin edita (términos/privacidad/faq). Si hay versión PUBLISHED, se
 *      renderiza su HTML (sanitizado con @lib/sanitize).
 *   2. content.js local — fallback para páginas sin contraparte editable en el
 *      admin (glosario, ifá, orishas…) o cuando el API aún no tiene versión.
 * Sin autenticación requerida.
 */

import { useParams, Link } from 'react-router-dom';
import Breadcrumb from '@components/common/Breadcrumb/Breadcrumb';
import { usePublicStaticPage } from '@hooks/domain/useStaticPages';
import { sanitizeHtml } from '@lib/sanitize';
import { getInfoContent } from './content';
import styles from './InfoPage.module.scss';

// Mapa route buyer (español) → slug del StaticPage admin (inglés). Sólo las
// páginas que el admin puede editar; el resto vive únicamente en content.js.
const API_SLUG = {
  terminos: 'terms',
  privacidad: 'privacy',
  faq: 'faq',
};

export default function InfoPage() {
  const { slug } = useParams();
  const page = getInfoContent(slug);

  // Sólo consulta el API para slugs con contraparte editable en el admin.
  const { data: apiPage } = usePublicStaticPage(API_SLUG[slug]);
  const apiHtml = apiPage?.content ? sanitizeHtml(apiPage.content) : null;

  if (!page && !apiHtml) {
    return (
      <div className={styles.notFound}>
        <h1>Página no encontrada</h1>
        <p>La sección que buscas no existe.</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  }

  const title = apiHtml ? (apiPage.title || page?.title || '') : page.title;

  return (
    <article className={styles.page}>
      <div className={styles.inner}>
        <Breadcrumb
          className={styles.breadcrumb}
          separator=" / "
          items={[
            { label: 'Inicio', to: '/' },
            { label: title },
          ]}
        />

        <h1 className={styles.title}>{title}</h1>

        {apiHtml ? (
          // Contenido editado por el admin (HTML sanitizado con @lib/sanitize).
          <div
            className={styles.body}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: apiHtml }}
          />
        ) : (
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
        )}

        <div className={styles.footer}>
          <Link to="/" className={styles.backLink}>&larr; Volver al inicio</Link>
        </div>
      </div>
    </article>
  );
}
