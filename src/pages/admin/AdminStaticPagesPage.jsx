/**
 * AdminStaticPagesPage — Kaupamex
 * UC-CFG-04: gestión de contenido estático (páginas informativas del
 * storefront: Acerca de, Términos, Privacidad, Devoluciones, FAQ).
 *
 * Master/detalle: la lista izquierda son las páginas canónicas; al elegir una
 * se carga su versión activa en el editor rich-text y se publica una nueva
 * versión con «Publicar».
 *
 * Consume /api/v2/admin/pages/ (StaticPageAdminListView), el detalle
 * /api/v2/admin/pages/<slug>/ y publica en
 * POST /api/v2/admin/pages/<slug>/publish/ (capacidad settings.manage).
 */
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';
import { useStaticPages, useStaticPage, STATIC_PAGES_QUERY_KEY } from '@hooks/domain/useStaticPages';
import { MetaTag, Button, Card } from '@components/common/primitives';
import Loader from '@components/common/Loader/Loader';
import RichTextEditor from '@components/common/RichTextEditor/RichTextEditor';
import styles from './AdminStaticPagesPage.module.scss';

const BASE_URL = '/api/v2/admin/pages/';

const STATUS_LABEL = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

export default function AdminStaticPagesPage() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading, isError } = useStaticPages();

  const [selectedSlug, setSelectedSlug] = useState(null);
  const { data: detail, isFetching: loadingDetail } = useStaticPage(selectedSlug);

  const [content, setContent] = useState('');
  const [isSaving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [savedNote, setSavedNote] = useState(null);

  // Al elegir una página, precarga el contenido de su versión activa.
  useEffect(() => {
    if (detail) {
      setContent(detail.current_version?.content ?? '');
      setSubmitError(null);
      setSavedNote(null);
    }
  }, [detail]);

  const selectPage = (slug) => { setSelectedSlug(slug); };

  const publish = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setSubmitError(null);
    setSavedNote(null);
    try {
      const { data } = await apiService.post(`${BASE_URL}${selectedSlug}/publish/`, { content });
      await queryClient.invalidateQueries({ queryKey: STATIC_PAGES_QUERY_KEY });
      setSavedNote(`Publicada la versión ${data.version} (${STATUS_LABEL[data.status] ?? data.status}).`);
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || err?.message || 'No se pudo publicar la página.');
    } finally {
      setSaving(false);
    }
  };

  const selected = pages.find((p) => p.slug === selectedSlug) || detail || null;
  const activeVersion = selected?.current_version;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Contenido · {pages.length} páginas</MetaTag>
          <h1 className={styles.title}>Contenido estático</h1>
          <p className={styles.subtitle}>
            Edita las páginas informativas del sitio. Cada guardado publica una
            versión nueva; el historial se conserva para revertir.
          </p>
        </div>
      </header>

      {isError && <p role="alert" className={styles.apiError}>No se pudieron cargar las páginas.</p>}
      {isLoading && (
        <div className={styles.loading}>
          <Loader type="converging-spinner" ariaLabel="Cargando páginas" />
        </div>
      )}

      {!isLoading && (
        <div className={styles.layout}>
          <nav className={styles.list} aria-label="Páginas de contenido">
            {pages.map((p) => {
              const active = p.slug === selectedSlug;
              const st = p.current_version?.status;
              return (
                <button
                  key={p.slug}
                  type="button"
                  className={`${styles.listItem}${active ? ` ${styles.listItemActive}` : ''}`}
                  aria-current={active ? 'true' : undefined}
                  onClick={() => selectPage(p.slug)}
                >
                  <span className={styles.listTitle}>{p.slug_display || p.title}</span>
                  <span className={styles.listMeta}>
                    {st ? STATUS_LABEL[st] ?? st : 'Sin publicar'}
                  </span>
                </button>
              );
            })}
            {pages.length === 0 && <p className={styles.empty}>Aún no hay páginas registradas.</p>}
          </nav>

          <section className={styles.editorPane} aria-label="Editor de contenido">
            {!selectedSlug && (
              <p className={styles.hint}>Selecciona una página para editar su contenido.</p>
            )}
            {selectedSlug && (
              <Card
                title={selected?.slug_display || selected?.title || 'Página'}
                footer={(
                  <Button type="button" variant="primary" onClick={publish} disabled={isSaving || loadingDetail}>
                    {isSaving ? 'Publicando…' : 'Publicar'}
                  </Button>
                )}
              >
                <p className={styles.versionMeta}>
                  {activeVersion
                    ? `Versión activa: v${activeVersion.version} · ${STATUS_LABEL[activeVersion.status] ?? activeVersion.status}`
                    : 'Sin versión publicada todavía.'}
                </p>
                {loadingDetail
                  ? <div className={styles.loading}><Loader type="pulsing" ariaLabel="Cargando contenido" /></div>
                  : (
                    <RichTextEditor
                      value={content}
                      onChange={setContent}
                      ariaProps={{ 'aria-label': 'Contenido de la página' }}
                    />
                  )}
                {submitError && <p role="alert" className={styles.apiError}>{submitError}</p>}
                {savedNote && <p role="status" className={styles.savedNote}>{savedNote}</p>}
              </Card>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
