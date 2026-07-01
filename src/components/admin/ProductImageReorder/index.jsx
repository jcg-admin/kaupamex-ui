/**
 * ProductImageReorder — UC-ADM-05
 *
 * Grid de imágenes de producto que se reordena por drag-and-drop (o teclado)
 * y persiste el orden vía POST …/reorder-images/. Usa el hook nativo
 * useSortableList (Fase 5). Optimista: aplica el orden en UI y revierte si el
 * backend falla.
 */
import { useState } from 'react';
import apiService from '@services/apiService';
import useSortableList, { arrayMove } from '@hooks/ui/useSortableList';
import styles from './ProductImageReorder.module.scss';

export default function ProductImageReorder({ productId, images = [] }) {
  const [imgs, setImgs] = useState(
    () => [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  );
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const persist = async (next, prev) => {
    setSaving(true);
    setError(null);
    try {
      await apiService.post(
        `/api/v2/admin/products/${productId}/reorder-images/`,
        { order: next.map((i) => i.id) },
      );
    } catch {
      setError('No se pudo guardar el nuevo orden. Se restauró el anterior.');
      setImgs(prev);
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = (from, to) => {
    setImgs((prev) => {
      const next = arrayMove(prev, from, to);
      persist(next, prev);
      return next;
    });
  };

  const { getItemProps } = useSortableList(imgs.length, handleReorder);

  if (imgs.length < 2) return null;

  return (
    <section className={styles.wrap} aria-label="Reordenar imágenes del producto">
      <h2 className={styles.title}>
        Imágenes — arrastra para ordenar {saving && <span className={styles.saving}>· guardando…</span>}
      </h2>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <ul className={styles.grid}>
        {imgs.map((img, i) => (
          <li key={img.id} className={styles.item} tabIndex={0} {...getItemProps(i)}>
            <img src={img.image_url} alt={img.alt_text || ''} className={styles.thumb} />
            <span className={styles.pos}>{i + 1}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
