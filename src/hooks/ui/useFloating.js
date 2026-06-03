/**
 * useFloating — PracticaYoruba UI
 *
 * Posiciona un elemento flotante (dropdown, popover, tooltip) respecto de
 * un elemento de referencia. Aplica los defaults del proyecto: placement
 * bottom-start con offset de 4px, y recalcula la posicion en scroll/resize.
 *
 * ADAPTACION NATIVA: el template-ecommerce-ui usa `@floating-ui/react` como
 * dependencia. En e-comerce-ui esa libreria NO esta instalada, por lo que
 * este hook implementa el posicionamiento con `getBoundingClientRect` puro,
 * sin agregar una dependencia nueva. Expone la misma forma de retorno
 * (`refs`, `floatingStyles`, `placement`) para preservar la ergonomia del
 * patron original. Si en el futuro se adopta @floating-ui, este hook puede
 * reemplazarse manteniendo el contrato publico.
 *
 * @param {object}  options
 * @param {string}  options.placement — 'bottom-start' | 'bottom' | 'top' | 'top-start'
 * @param {number}  options.offsetPx  — separacion en px entre referencia y flotante
 * @param {boolean} options.enabled   — si false, no escucha scroll/resize
 * @returns {{ refs: { reference, floating, setReference, setFloating },
 *             floatingStyles: object, placement: string }}
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function computePosition(refEl, placement, offsetPx) {
  const rect = refEl.getBoundingClientRect();
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;

  let top;
  let left = rect.left + scrollX;

  if (placement.startsWith('top')) {
    top = rect.top + scrollY - offsetPx;
  } else {
    // bottom (default)
    top = rect.bottom + scrollY + offsetPx;
  }

  // *-start alinea con el borde izquierdo de la referencia (ya aplicado);
  // sin sufijo, lo dejamos en el mismo left por simplicidad nativa.
  return {
    position: 'absolute',
    top: `${Math.round(top)}px`,
    left: `${Math.round(left)}px`,
  };
}

export default function useFloating({
  placement = 'bottom-start',
  offsetPx = 4,
  enabled = true,
} = {}) {
  const referenceRef = useRef(null);
  const floatingRef = useRef(null);
  const [floatingStyles, setFloatingStyles] = useState({
    position: 'absolute',
    top: '0px',
    left: '0px',
  });

  const update = useCallback(() => {
    if (!referenceRef.current) return;
    setFloatingStyles(
      computePosition(referenceRef.current, placement, offsetPx),
    );
  }, [placement, offsetPx]);

  const setReference = useCallback(
    (node) => {
      // Solo reaccionar a un cambio real de nodo. Si el callback se reinvoca
      // con el mismo nodo (re-render que reasocia el ref), NO recalcular: eso
      // dispararia setState en cada render -> "Maximum update depth exceeded".
      if (referenceRef.current === node) return;
      referenceRef.current = node;
      if (node) update();
    },
    [update],
  );

  const setFloating = useCallback((node) => {
    floatingRef.current = node;
  }, []);

  useEffect(() => {
    if (!enabled) return undefined;
    update();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [enabled, update]);

  // refs con identidad estable: si se recrea el objeto en cada render, los
  // consumidores que lo listan como dependencia (Dropdown/Popover) reasocian
  // sus ref-callbacks en bucle. useMemo lo congela mientras setReference/
  // setFloating no cambien (son estables salvo cambio de placement/offset).
  const refs = useMemo(
    () => ({
      reference: referenceRef,
      floating: floatingRef,
      setReference,
      setFloating,
    }),
    [setReference, setFloating],
  );

  return {
    refs,
    floatingStyles,
    placement,
  };
}
