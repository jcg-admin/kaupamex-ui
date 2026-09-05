/**
 * Error Handling Middleware — Kaupamex
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
import { logError } from '@utils/errorLog';

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
export const errorLoggingMiddleware = () => (next) => (action) => {
  if (action.type?.endsWith('/rejected')) {
    const error = action.payload;
    // Registrar en el log de errores del cliente (consola + buffer). Antes
    // solo se logueaba en dev; ahora tambien en prod para que cualquier
    // /rejected quede registrado (ventana de diagnostico, "el log").
    logError({
      type:    'redux/rejected',
      context: _extractContext(action.type),
      code:    error?.code,
      status:  error?.statusCode,
      message: error?.message,
      detail:  { action: action.type, retryable: isRetryableError(error ?? {}) },
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
