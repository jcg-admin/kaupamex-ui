/**
 * ProductImageFieldArray — UC-ADM-06
 *
 * Editor tipo FieldArray de la metadata de las imágenes de un producto:
 * por cada imagen, el admin edita el texto alternativo (alt_text) y elige
 * cuál es la portada (is_cover, radio de selección única). Persiste en lote
 * vía PATCH …/images/ con {images:[{id, alt_text, is_cover}]}.
 *
 * El orden se gestiona aparte (ProductImageReorder, UC-ADM-05). Aquí NO se
 * suben archivos: sólo se edita la metadata del set existente.
 */
import { useState } from 'react';
import apiService from '@services/apiService';
import styles from './ProductImageFieldArray.module.scss';

const normalize = (images) =>
  [...images]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((img) => ({
      id: img.id,
      image_url: img.image_url,
      alt_text: img.alt_text ?? '',
      is_cover: Boolean(img.is_cover),
    }));

export default function ProductImageFieldArray({ productId, images = [], onSaved }) {
  const [rows, setRows] = useState(() => normalize(images));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const setAlt = (id, value) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, alt_text: value } : r)));

  // Portada de selección única: marcar una desmarca el resto (espeja la
  // invariante del backend).
  const setCover = (id) =>
    setRows((prev) => prev.map((r) => ({ ...r, is_cover: r.id === id })));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await apiService.patch(
        `/api/v2/admin/products/${productId}/images/`,
        { images: rows.map((r) => ({ id: r.id, alt_text: r.alt_text, is_cover: r.is_cover })) },
      );
      setSaved(true);
      if (onSaved) onSaved(res?.data);
    } catch {
      setError('No se pudieron guardar los cambios de las imágenes.');
    } finally {
      setSaving(false);
    }
  };

  if (rows.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label="Editar metadata de imágenes">
      <h2 className={styles.title}>Metadata de imágenes</h2>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      {saved && !error && <p role="status" className={styles.ok}>Cambios guardados.</p>}
      <ul className={styles.list}>
        {rows.map((r) => (
          <li key={r.id} className={styles.item}>
            <img src={r.image_url} alt={r.alt_text} className={styles.thumb} />
            <div className={styles.fields}>
              <label className={styles.field}>
                <span className={styles.label}>Texto alternativo</span>
                <input
                  type="text"
                  className={styles.input}
                  value={r.alt_text}
                  maxLength={200}
                  onChange={(e) => setAlt(r.id, e.target.value)}
                />
              </label>
              <label className={styles.cover}>
                <input
                  type="radio"
                  name={`cover-${productId}`}
                  checked={r.is_cover}
                  onChange={() => setCover(r.id)}
                />
                <span>Portada</span>
              </label>
            </div>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className={styles.save}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Guardando…' : 'Guardar imágenes'}
      </button>
    </section>
  );
}
