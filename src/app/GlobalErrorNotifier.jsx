/**
 * GlobalErrorNotifier — Kaupamex UI
 *
 * Cierra un hueco: ``errorSlice.globalError`` lo escribia el
 * ``errorHandlingMiddleware`` para errores sin contexto (500, red), pero
 * NADA lo mostraba al usuario. Este componente observa ese error global y lo
 * presenta en una ventana (toast) clara, luego lo limpia. Asi cualquier fallo
 * inesperado deja de ser silencioso.
 *
 * Los errores por dominio (``contextErrors``) los muestra cada pantalla en su
 * sitio; aqui solo se surface el error GLOBAL (el que no tiene dueno).
 */
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectGlobalError, clearGlobalError } from '@redux/slices/errorSlice';
import { addToast } from '@redux/slices/uiSlice';
import { toReadableString } from '@utils/toReadableString';

// Mensaje amigable segun el tipo de fallo (sin jerga tecnica para el usuario).
function friendlyMessage(err) {
  const status = err?.statusCode;
  if (status === 401 || err?.code === 'UNAUTHORIZED') return null; // lo maneja UnauthorizedListener
  if (status >= 500) return 'Tuvimos un problema de nuestro lado. Inténtalo de nuevo en un momento.';
  if (err?.code === 'NETWORK' || err?.code === 'TIMEOUT') {
    return 'No pudimos conectar. Revisa tu conexión e inténtalo de nuevo.';
  }
  // `err.message` puede no ser string (dict de validación DRF); coercer a
  // texto legible para nunca surface "[object Object]" en el toast.
  return toReadableString(err?.message, 'Ocurrió un error inesperado.');
}

export default function GlobalErrorNotifier() {
  const dispatch = useDispatch();
  const globalError = useSelector(selectGlobalError);

  useEffect(() => {
    if (!globalError) return;
    const message = friendlyMessage(globalError);
    if (message) {
      dispatch(addToast({
        type: 'error',
        title: 'Algo salió mal',
        message,
        duration: 6000,
      }));
    }
    // Consumido: limpiar para no re-mostrarlo en el siguiente render.
    dispatch(clearGlobalError());
  }, [globalError, dispatch]);

  return null;
}
