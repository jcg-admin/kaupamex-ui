// Portado del prototipo funcional -progress/kno-react-common (codigo propio del ejecutor).
// Origen: kno-react-common/hooks/useMergedRef.mjs
/**
 * useMergedRef — Kaupamex UI
 *
 * Combina un ref reenviado (forwardRef) con un ref interno sobre el MISMO nodo.
 * Devuelve `[innerRef, setRef]`: se pasa `setRef` al `ref=` del elemento y el
 * componente conserva acceso al nodo vía `innerRef.current`, mientras el padre
 * recibe el nodo por su propio ref (callback u objeto).
 *
 * @param {Function|object|null} forwardedRef — ref del padre (callback u objeto)
 * @returns {[React.MutableRefObject, Function]} `[innerRef, setRef]`
 */
import { useRef, useCallback } from 'react';

export default function useMergedRef(forwardedRef) {
  const innerRef = useRef(null);
  const setRef = useCallback((node) => {
    innerRef.current = node;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else if (forwardedRef) {
      forwardedRef.current = node;
    }
  }, [forwardedRef]);
  return [innerRef, setRef];
}
