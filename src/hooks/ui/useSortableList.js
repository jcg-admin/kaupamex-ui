// Portado del prototipo funcional -progress/kno-react-common (codigo propio del ejecutor).
// Origen: kno-react-common/hooks/useDraggable.mjs + useDroppable.mjs (concepto
// drag-to-reorder). Reimplementado nativo con HTML5 Drag-and-Drop en vez de la
// maquinaria @progress/kno-draggable-common (pointer events + autoscroll), que
// arrastraria un subsistema entero; para reordenar una lista el DnD nativo basta.
/**
 * useSortableList — Kaupamex UI
 *
 * Reordenamiento de una lista por arrastre (HTML5 DnD) + teclado. Se pasa la
 * longitud y un callback `onReorder(from, to)`; el hook devuelve
 * `getItemProps(index)` para esparcir sobre cada item arrastrable.
 *
 * @param {number} count — número de items
 * @param {(from:number, to:number)=>void} onReorder — aplica el movimiento
 * @returns {{ getItemProps:Function, dragIndex:number|null, overIndex:number|null }}
 */
import { useState, useCallback } from 'react';

/** Mueve el elemento `from`→`to` devolviendo una copia (no muta el original). */
export function arrayMove(list, from, to) {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list.slice();
  }
  const copy = list.slice();
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}

export default function useSortableList(count, onReorder) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const reset = useCallback(() => { setDragIndex(null); setOverIndex(null); }, []);

  const commit = useCallback((from, to) => {
    if (from != null && to != null && from !== to) onReorder(from, to);
    reset();
  }, [onReorder, reset]);

  const getItemProps = useCallback((index) => ({
    draggable: true,
    onDragStart: () => setDragIndex(index),
    onDragOver: (e) => { e.preventDefault(); setOverIndex(index); },
    onDrop: (e) => { e.preventDefault(); commit(dragIndex, index); },
    onDragEnd: reset,
    // Teclado accesible: Ctrl/⌘ + ↑/↓ mueve el item enfocado.
    onKeyDown: (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'ArrowUp' && index > 0) {
        e.preventDefault(); onReorder(index, index - 1);
      } else if (e.key === 'ArrowDown' && index < count - 1) {
        e.preventDefault(); onReorder(index, index + 1);
      }
    },
    'aria-grabbed': dragIndex === index || undefined,
  }), [commit, reset, dragIndex, onReorder, count]);

  return { getItemProps, dragIndex, overIndex };
}
