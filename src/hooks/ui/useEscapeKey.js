/**
 * useEscapeKey — PracticaYoruba UI
 *
 * Llama `handler` cuando el usuario presiona la tecla Escape.
 * Solo activo cuando `enabled=true`.
 *
 * Portado de template-ecommerce-ui (src/hooks/ui/useEscapeKey.js).
 *
 * @param {Function} handler — callback al presionar Escape
 * @param {boolean}  enabled — activa/desactiva el listener
 */
import { useEffect } from 'react';

export default function useEscapeKey(handler, enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;

    const listener = (event) => {
      if (event.key === 'Escape') handler(event);
    };

    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [handler, enabled]);
}
