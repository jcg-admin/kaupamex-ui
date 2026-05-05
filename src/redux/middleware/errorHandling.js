/**
 * Error Handling Middleware — PracticaYoruba
 *
 * Intercepta automáticamente TODAS las acciones rejected del store.
 * Esto significa que cualquier createAsyncThunk que falle (en auth, cart,
 * catalog, checkout, etc.) pasa por aquí sin necesidad de manejo manual
 * en cada componente.
 *
 * Responsabilidades:
 *   1. Registrar el error en errorSlice por dominio (context).
 *   2. Detectar 401 y disparar el evento py:unauthorized para que
 *      authSlice limpie la sesión sin imports circulares.
 *   3. Log estructurado en desarrollo.
 */

import {
  handleAPIError,
  setContextError,
  setErrorHandling,
} from '@redux/slices/errorSlice';
import { isRetryableError } from '@utils/apiErrors';

// ─── errorHandlingMiddleware ───────────────────────────────────────────
export const errorHandlingMiddleware = (store) => (next) => (action) => {
  if (!action.type?.endsWith('/rejected')) {
    return next(action);
  }

  const error   = action.payload;
  const context = _extractContext(action.type);

  store.dispatch(setErrorHandling(true));

  // 401 → limpiar sesión via evento global (evita circular import)
  if (error?.statusCode === 401 || error?.code === 'UNAUTHORIZED') {
    window.dispatchEvent(new CustomEvent('py:unauthorized'));
  }

  // Registrar en el slice de errores
  if (context) {
    store.dispatch(setContextError({ context, error }));
  } else {
    store.dispatch(handleAPIError(error));
  }

  setTimeout(() => store.dispatch(setErrorHandling(false)), 0);

  return next(action);
};

// ─── errorLoggingMiddleware ────────────────────────────────────────────
export const errorLoggingMiddleware = (store) => (next) => (action) => {
  if (action.type?.endsWith('/rejected') && process.env.NODE_ENV !== 'production') {
    const error = action.payload;
    const state = store.getState();
    console.error('[Redux /rejected]', {
      action:    action.type,
      code:      error?.code,
      message:   error?.message,
      status:    error?.statusCode,
      retryable: isRetryableError(error ?? {}),
      user:      state.auth?.user?.id ?? null,
    });
  }
  return next(action);
};

// ─── Helpers ──────────────────────────────────────────────────────────
/**
 * Extrae el dominio del tipo de acción.
 * "cart/addItem/rejected"    → "cart"
 * "catalog/fetchProducts/rejected" → "catalog"
 */
function _extractContext(actionType) {
  const parts = actionType.split('/');
  return parts[0] !== '@@INIT' ? parts[0] : null;
}

export default errorHandlingMiddleware;
