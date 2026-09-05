/**
 * useFloating — Kaupamex UI
 *
 * Posiciona un elemento flotante (dropdown, popover, tooltip) respecto de
 * un elemento de referencia. Aplica los defaults del proyecto: placement
 * bottom-start con offset de 4px, y recalcula la posicion en scroll/resize.
 *
 * ADAPTACION NATIVA: el template-ecommerce-ui usa `@floating-ui/react` como
 * dependencia. En kaupamex-ui esa libreria NO esta instalada, por lo que
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

function computePosition(refEl, floatEl, placement, offsetPx) {
  const rect = refEl.getBoundingClientRect();

  // El flotante (Dropdown/Popover/Tooltip) se renderiza DENTRO de un wrapper
  // `position: relative`, así que su `position: absolute` se resuelve respecto
  // de ese wrapper (su offsetParent), NO del documento. Por eso las coordenadas
  // deben ser relativas al offsetParent: usar coords de documento
  // (rect.left + scrollX) empujaba el panel ~Xpx a la derecha del trigger y lo
  // sacaba de la pantalla (bug "Mi cuenta" fuera de pantalla, #77).
  const offsetParent = floatEl && floatEl.offsetParent;

  if (offsetParent && offsetParent !== document.body) {
    const opRect = offsetParent.getBoundingClientRect();
    // `-end` alinea el borde DERECHO del panel con el de la referencia (útil
    // en triggers pegados al borde derecho, p.ej. "Mi cuenta" del Header);
    // el resto alinea por la izquierda.
    const left = (placement.endsWith('-end') && floatEl)
      ? rect.right - floatEl.offsetWidth - opRect.left + offsetParent.scrollLeft
      : rect.left - opRect.left + offsetParent.scrollLeft;
    const top = placement.startsWith('top')
      ? rect.top - opRect.top + offsetParent.scrollTop - offsetPx
      : rect.bottom - opRect.top + offsetParent.scrollTop + offsetPx;
    return {
      position: 'absolute',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
    };
  }

  // Fallback (flotante en <body> o sin offsetParent posicionado): coordenadas
  // de documento clásicas.
  const scrollX = window.scrollX || 0;
  const scrollY = window.scrollY || 0;
  const left = rect.left + scrollX;
  const top = placement.startsWith('top')
    ? rect.top + scrollY - offsetPx
    : rect.bottom + scrollY + offsetPx;
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
      computePosition(referenceRef.current, floatingRef.current, placement, offsetPx),
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
    if (floatingRef.current === node) return;
    floatingRef.current = node;
    // El flotante monta DESPUÉS que la referencia (AnimatePresence al abrir).
    // Recalcular ahora que ya existe su offsetParent, para posicionarlo
    // relativo al wrapper y no dejarlo en el (0,0) inicial.
    if (node) update();
  }, [update]);

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
