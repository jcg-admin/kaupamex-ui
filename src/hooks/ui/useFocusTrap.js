// Portado del prototipo funcional -progress/kno-react-common (codigo propio del ejecutor).
// Origen: kno-react-common/trappedFocus + constants (FOCUSABLE/TABBABLE_ELEMENTS).
/**
 * useFocusTrap — PracticaYoruba UI
 *
 * Atrapa el foco de teclado dentro de `ref` mientras `enabled=true`, para
 * overlays que NO usan el <dialog> nativo (que ya trae focus trap de fabrica).
 * Tabular desde el ultimo elemento vuelve al primero y Shift+Tab desde el
 * primero salta al ultimo. Al desmontar, restaura el foco al elemento que lo
 * tenia antes de abrir.
 *
 * Para Modal/Offcanvas NO se usa: ahi el <dialog> + showModal() atrapa el foco
 * nativamente (mejor que un polyfill JS). Este hook cubre los overlays basados
 * en <div role="dialog"> (SearchModal, formularios admin).
 *
 * @param {React.RefObject<HTMLElement>} ref — contenedor del overlay
 * @param {boolean} enabled — activa/desactiva el trap
 */
import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isVisible(el) {
  // Filtro por estilo (no por layout): jsdom no calcula offsetParent/rects, pero
  // getComputedStyle sirve en jsdom y en el navegador. display/visibility vacios
  // (sin estilo) cuentan como visibles.
  const style = window.getComputedStyle(el);
  return style.display !== 'none' && style.visibility !== 'hidden' && !el.hidden;
}

function getFocusable(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE)).filter(isVisible);
}

export default function useFocusTrap(ref, enabled = true) {
  useEffect(() => {
    if (!enabled || !ref.current) return undefined;
    const container = ref.current;
    const previousActive = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const items = getFocusable(container);
      if (items.length === 0) {
        // Sin elementos enfocables: mantener el foco en el contenedor.
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      // Restaurar el foco previo si el elemento sigue en el DOM.
      if (previousActive && typeof previousActive.focus === 'function') {
        previousActive.focus();
      }
    };
  }, [ref, enabled]);
}
