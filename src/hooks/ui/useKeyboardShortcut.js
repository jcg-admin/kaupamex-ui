/**
 * useKeyboardShortcut — Kaupamex UI
 *
 * Registra un atajo de teclado y llama `handler` cuando coincide la
 * combinacion (tecla + modificadores ctrl/meta/shift/alt).
 *
 * Portado de template-ecommerce-ui (src/hooks/ui/useKeyboardShortcut.js).
 *
 * @param {{ key: string, ctrl?: boolean, meta?: boolean, shift?: boolean, alt?: boolean }} shortcut
 * @param {Function} handler — callback al coincidir el atajo
 * @param {boolean}  enabled — activa/desactiva el listener
 */
import { useEffect } from 'react';

export default function useKeyboardShortcut(shortcut, handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const {
      key,
      ctrl = false,
      meta = false,
      shift = false,
      alt = false,
    } = shortcut;

    const listener = (event) => {
      if (
        event.key.toLowerCase() === key.toLowerCase() &&
        event.ctrlKey === ctrl &&
        event.metaKey === meta &&
        event.shiftKey === shift &&
        event.altKey === alt
      ) {
        event.preventDefault();
        handler(event);
      }
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [shortcut, handler, enabled]);
}
