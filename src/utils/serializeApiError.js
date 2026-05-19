/**
 * serializeApiError — PracticaYoruba
 *
 * Convierte cualquier error capturado en un thunk en un objeto plano
 * y serializable apto para `rejectWithValue`. Preserva los campos
 * tipados (`code`, `statusCode`, `validationErrors`) que produce
 * `apiService.js` mediante `apiErrors.js`, de modo que el
 * `errorHandlingMiddleware` pueda alimentar correctamente
 * `errorSlice.contextErrors[dominio]`.
 *
 * Reglas:
 *   - Si el error es instancia de APIError (TimeoutError, NetworkError,
 *     ValidationError, NotFoundError, ConflictError, ...) se copian sus
 *     campos canonicos.
 *   - Si no, se intenta extraer `body.detail` (formato DRF) o `message`.
 *   - El resultado siempre es un objeto plano con `message`, `code`,
 *     `statusCode` y opcionalmente `validationErrors`.
 */

import { APIError } from '@utils/apiErrors';

export function serializeApiError(err) {
  if (err instanceof APIError) {
    return {
      message:          err.message,
      code:             err.code,
      statusCode:       err.statusCode ?? null,
      name:             err.name,
      validationErrors: err.validationErrors ?? null,
    };
  }

  const message =
    err?.body?.detail ||
    err?.message ||
    'Error inesperado.';

  return {
    message,
    code:       err?.code       ?? 'UNKNOWN',
    statusCode: err?.status     ?? err?.statusCode ?? null,
    name:       err?.name       ?? 'Error',
    validationErrors: err?.validationErrors ?? null,
  };
}

export default serializeApiError;
