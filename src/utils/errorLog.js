/**
 * errorLog — PracticaYoruba
 *
 * Log de errores del cliente (ventana de diagnostico). Mantiene un buffer
 * circular acotado en memoria con los ultimos errores relevantes (API 5xx,
 * red, 401/403, y errores de render capturados por ErrorBoundary) y los emite
 * por consola SIEMPRE (no solo en dev), para que un error en produccion quede
 * registrado en la consola del navegador y sea inspeccionable.
 *
 * No persiste a storage (privacidad + evita crecer sin control) ni envia a un
 * backend: es un log local. Si en el futuro se quiere telemetria remota, este
 * es el unico punto que hay que cablear.
 */

const MAX_ENTRIES = 50;
const _buffer = [];

/**
 * Registra un error. `entry` es un objeto libre; se normalizan los campos
 * comunes. Devuelve la entrada registrada (con timestamp).
 */
export function logError(entry = {}) {
  const record = {
    time:    new Date().toISOString(),
    type:    entry.type    ?? 'error',
    code:    entry.code    ?? null,
    status:  entry.status  ?? null,
    context: entry.context ?? null,
    message: entry.message ?? 'Error desconocido',
    detail:  entry.detail  ?? null,
  };

  _buffer.push(record);
  if (_buffer.length > MAX_ENTRIES) _buffer.shift();

  // Consola siempre: un error debe ser visible aunque estemos en produccion.
  // eslint-disable-next-line no-console
  console.error('[PY]', record.type, record.status ?? '', record.message, record);

  // En dev, exponer el buffer para inspeccion manual desde la consola.
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    window.__PY_ERROR_LOG__ = _buffer;
  }

  return record;
}

/** Devuelve una copia del log (mas reciente al final). */
export function getErrorLog() {
  return _buffer.slice();
}

/** Vacia el log (util en tests). */
export function clearErrorLog() {
  _buffer.length = 0;
}

export default logError;
