/**
 * AdminBannersPage — PracticaYoruba
 * UC-CFG-06 / G-CFG-01: gestión de banners de portada.
 *
 * Los banners son activos visuales (imagen + orden), así que la lista se
 * presenta como una galería de tarjetas ordenables por arrastre — no una
 * tabla. Reutiliza los primitivos integrados: FileUpload (portado de
 * kno-react-upload) para la subida y useSortableList (portado de
 * kno-sortable) para reordenar, igual que ProductImageReorder.
 *
 * Consume /api/v2/admin/banners/ (BannerViewSet, capacidad banners.manage)
 * + la acción reorder por placement.
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';
import { useAdminBanners, ADMIN_BANNERS_QUERY_KEY } from '@hooks/domain/useBanners';
import { MetaTag, Button, Card } from '@components/common/primitives';
import FileUpload from '@components/common/FileUpload/FileUpload';
import Loader from '@components/common/Loader/Loader';
import ConfirmDialog from '@components/common/ConfirmDialog/ConfirmDialog';
import Icon from '@components/common/Icon/Icon';
import useSortableList, { arrayMove } from '@hooks/ui/useSortableList';
import styles from './AdminBannersPage.module.scss';

const BASE_URL = '/api/v2/admin/banners/';
const REORDER_URL = '/api/v2/admin/banners/reorder/';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB (UC-CFG-06 PARTE 6.1)
const PLACEMENTS = [
  { value: 'HERO', label: 'Hero de portada' },
  { value: 'PROMO_STRIP', label: 'Franja promocional' },
];
const EMPTY = { placement: 'HERO', title: '', alt_text: '', link_url: '', is_active: true };

const placementLabel = (v) => PLACEMENTS.find((p) => p.value === v)?.label || v;

/** Galería ordenable de una placement. Reordena por arrastre y persiste. */
function BannerGallery({ placement, items, onReorder, onEdit, onDelete }) {
  const ordered = [...items].sort((a, b) => (a.order - b.order) || (a.id - b.id));
  const { getItemProps, dragIndex, overIndex } = useSortableList(
    ordered.length,
    (from, to) => onReorder(arrayMove(ordered, from, to)),
  );
  if (!ordered.length) {
    return <p className={styles.empty}>Sin banners en «{placementLabel(placement)}».</p>;
  }
  return (
    <ul className={styles.gallery} aria-label={`Banners — ${placementLabel(placement)} (arrastra para ordenar)`}>
      {ordered.map((b, i) => (
        <li
          key={b.id}
          className={`${styles.card}${!b.is_active ? ` ${styles.inactive}` : ''}${dragIndex === i ? ` ${styles.dragging}` : ''}${overIndex === i ? ` ${styles.over}` : ''}`}
          tabIndex={0}
          {...getItemProps(i)}
        >
          {b.image_url
            ? <img src={b.image_url} alt={b.alt_text} className={styles.cardImg} />
            : <div className={styles.cardNoImg}>Sin imagen</div>}
          <div className={styles.cardBody}>
            <span className={styles.cardAlt}>{b.alt_text}</span>
            <span className={styles.cardMeta}>#{i + 1} · {b.is_active ? 'Activo' : 'Inactivo'}</span>
          </div>
          <div className={styles.cardActions}>
            <button type="button" className={styles.actionBtn} onClick={() => onEdit(b)} title="Editar" aria-label="Editar"><Icon name="pencil" size={16} /></button>
            <button type="button" className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => onDelete(b)} title="Eliminar" aria-label="Eliminar"><Icon name="x" size={16} /></button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function AdminBannersPage() {
  const queryClient = useQueryClient();
  const { data: banners = [], isLoading, isError } = useAdminBanners();

  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSaving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ADMIN_BANNERS_QUERY_KEY });

  const startCreate = () => {
    setEditingId(null); setForm(EMPTY); setFile(null); setErrors({}); setSubmitError(null);
  };
  const startEdit = (b) => {
    setEditingId(b.id);
    setForm({
      placement: b.placement,
      title: b.title ?? '',
      alt_text: b.alt_text ?? '',
      link_url: b.link_url ?? '',
      is_active: b.is_active,
    });
    setFile(null); setErrors({}); setSubmitError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.alt_text.trim()) e.alt_text = 'El texto alternativo es obligatorio (accesibilidad).';
    if (!editingId && !file) e.image = 'La imagen es obligatoria al crear.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    setSubmitError(null);
    try {
      const fd = new FormData();
      if (file) fd.append('image', file);
      fd.append('placement', form.placement);
      fd.append('title', form.title.trim());
      fd.append('alt_text', form.alt_text.trim());
      fd.append('link_url', form.link_url.trim());
      fd.append('is_active', form.is_active ? 'true' : 'false');
      if (editingId) await apiService.patch(`${BASE_URL}${editingId}/`, fd);
      else await apiService.post(BASE_URL, fd);
      await refresh();
      startCreate();
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || err?.message || 'No se pudo guardar el banner.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await apiService.delete(`${BASE_URL}${pendingDelete.id}/`);
      await refresh();
    } finally {
      setPendingDelete(null);
    }
  };

  const reorder = async (nextOrdered) => {
    try {
      await apiService.post(REORDER_URL, { order: nextOrdered.map((b) => b.id) });
      await refresh();
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || 'No se pudo reordenar.');
    }
  };

  const field = (name, id) => ({
    id, name, value: form[name],
    onChange: (e) => {
      setForm((p) => ({ ...p, [name]: e.target.value }));
      if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    },
    className: errors[name] ? `${styles.input} ${styles.inputError}` : styles.input,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-error` : undefined,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Portada · {banners.length} banners</MetaTag>
          <h1 className={styles.title}>Banners de portada</h1>
        </div>
      </header>

      <Card
        as="form"
        onSubmit={handleSubmit}
        noValidate
        title={editingId ? 'Editar banner' : 'Nuevo banner'}
        footer={(
          <>
            {editingId && <Button type="button" variant="secondary" onClick={startCreate}>Cancelar</Button>}
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear banner'}
            </Button>
          </>
        )}
      >
        <div className={styles.formImage}>
          <FileUpload
            id="banner-image"
            accept="image/*"
            maxSizeBytes={MAX_IMAGE_BYTES}
            value={file ? [file] : []}
            onChange={(files) => { setFile(files[0] ?? null); if (errors.image) setErrors((p) => ({ ...p, image: '' })); }}
            label={editingId ? 'Reemplazar imagen' : 'Seleccionar imagen'}
            hint={editingId ? 'Deja vacío para conservar la imagen actual. Máx. 2 MB.' : 'PNG/JPG, máx. 2 MB.'}
            error={errors.image}
          />
        </div>
        <div className={styles.grid}>
          <div className={styles.fieldBlock}>
            <label htmlFor="banner-placement" className={styles.label}>Ubicación</label>
            <select {...field('placement', 'banner-placement')}>
              {PLACEMENTS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="banner-alt" className={styles.label}>Texto alternativo <span className={styles.required} aria-hidden="true">*</span></label>
            <input {...field('alt_text', 'banner-alt')} type="text" maxLength={200} aria-required />
            {errors.alt_text && <p id="banner-alt-error" className={styles.fieldError}>{errors.alt_text}</p>}
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="banner-title" className={styles.label}>Título (opcional)</label>
            <input {...field('title', 'banner-title')} type="text" maxLength={200} />
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="banner-link" className={styles.label}>Enlace (opcional)</label>
            <input {...field('link_url', 'banner-link')} type="url" placeholder="https://…" />
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox" name="is_active" checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              Activo (visible en la portada)
            </label>
          </div>
        </div>
        {submitError && <p role="alert" className={styles.apiError}>{submitError}</p>}
      </Card>

      {isError && <p role="alert" className={styles.apiError}>No se pudieron cargar los banners.</p>}
      {isLoading && (
        <div className={styles.loading}>
          <Loader type="converging-spinner" ariaLabel="Cargando banners" />
        </div>
      )}

      {!isLoading && PLACEMENTS.map((p) => (
        <section key={p.value} className={styles.section}>
          <h2 className={styles.sectionTitle}>{p.label}</h2>
          <BannerGallery
            placement={p.value}
            items={banners.filter((b) => b.placement === p.value)}
            onReorder={reorder}
            onEdit={startEdit}
            onDelete={setPendingDelete}
          />
        </section>
      ))}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Eliminar banner"
        message={<>¿Eliminar el banner <strong>{pendingDelete?.alt_text}</strong> ({placementLabel(pendingDelete?.placement)})?</>}
        confirmLabel="Eliminar"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
