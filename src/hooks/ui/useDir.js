// Portado del prototipo funcional -progress/kno-react-common (codigo propio del ejecutor).
// Origen: kno-react-common/hooks/useDir.mjs
/**
 * useDir — Kaupamex UI
 *
 * Resuelve la dirección de escritura (`ltr` / `rtl`) de un elemento leyendo su
 * estilo computado. Si `initial` viene dado, no recalcula. Útil para componentes
 * que deben espejar su layout en contextos RTL.
 *
 * La app es LTR (español), así que hoy no hay consumidor; se porta como parte de
 * la adaptación de kno-react-common para soportar RTL si se agrega en el futuro.
 *
 * @param {React.RefObject<HTMLElement>} ref — elemento a medir
 * @param {('ltr'|'rtl')} [initial] — dirección forzada (si se conoce)
 * @param {Array} [deps] — dependencias del efecto de medición
 * @returns {('ltr'|'rtl'|undefined)}
 */
import { useState, useEffect } from 'react';

export default function useDir(ref, initial, deps = []) {
  const [dir, setDir] = useState(initial);
  useEffect(() => {
    if (!dir && typeof window !== 'undefined' && ref.current) {
      const computed = window.getComputedStyle(ref.current).direction;
      if (computed) setDir(computed);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return dir;
}
