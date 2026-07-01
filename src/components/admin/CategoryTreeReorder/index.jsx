/**
 * CategoryTreeReorder — UC-ADM-01
 *
 * Vista de árbol de categorías con reordenamiento de hermanos por drag-and-drop
 * (o Ctrl+flechas). Cada grupo de hermanos se reordena de forma independiente y
 * persiste con POST admin/categories/reorder/ ({parent, order}). Optimista:
 * aplica el orden y revierte si el backend falla.
 *
 * Nota: arma el árbol con las categorías recibidas (página actual). Para
 * catálogos que excedan una página, el reorden por padre requiere que sus
 * hermanos estén en la misma página (limitación conocida, follow-up).
 */
import { useState, useEffect, useMemo } from 'react';
import apiService from '@services/apiService';
import useSortableList, { arrayMove } from '@hooks/ui/useSortableList';
import { buildTree } from './categoryTree';
import styles from './CategoryTreeReorder.module.scss';

function SiblingGroup({ nodes, parentId, depth, onReorder }) {
  const [items, setItems] = useState(nodes);
  useEffect(() => { setItems(nodes); }, [nodes]);

  const handleReorder = (from, to) => {
    setItems((prev) => {
      const next = arrayMove(prev, from, to);
      onReorder(parentId, next.map((n) => n.id), () => setItems(prev));
      return next;
    });
  };
  const { getItemProps } = useSortableList(items.length, handleReorder);

  return (
    <ul className={styles.group}>
      {items.map((node, i) => (
        <li key={node.id} className={styles.node}>
          <div
            className={styles.row}
            style={{ paddingLeft: `${depth * 18}px` }}
            tabIndex={0}
            {...getItemProps(i)}
          >
            <span className={styles.grip} aria-hidden="true">⠿</span>
            <span className={styles.name}>{node.name}</span>
          </div>
          {node.children.length > 0 && (
            <SiblingGroup
              nodes={node.children}
              parentId={node.id}
              depth={depth + 1}
              onReorder={onReorder}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export default function CategoryTreeReorder({ categories = [], onReordered }) {
  const [error, setError] = useState(null);
  const tree = useMemo(() => buildTree(categories), [categories]);

  const persist = async (parentId, orderIds, revert) => {
    setError(null);
    try {
      await apiService.post('/api/v2/admin/categories/reorder/', {
        parent: parentId ?? null,
        order: orderIds,
      });
      onReordered?.();
    } catch {
      setError('No se pudo guardar el nuevo orden. Se restauró el anterior.');
      revert();
    }
  };

  if (categories.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label="Reordenar árbol de categorías">
      <h2 className={styles.title}>Árbol — arrastra para ordenar hermanos</h2>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <SiblingGroup nodes={tree} parentId={null} depth={0} onReorder={persist} />
    </section>
  );
}
