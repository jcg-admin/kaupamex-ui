/**
 * toReadableString — PracticaYoruba
 *
 * Coerción DEFENSIVA de un valor arbitrario a un string legible para el
 * usuario. Cierra la regresión donde un `message` que NO es string (p.ej. un
 * dict de validación de DRF `{email: ["ya existe"]}`) se renderizaba como el
 * literal "[object Object]" en un toast (visible en /checkout).
 *
 * Reglas de extracción, en orden:
 *   - string        → se devuelve tal cual (trim). Vacío → fallback.
 *   - null/undefined→ fallback.
 *   - number/bool   → String(v).
 *   - Array         → se aplican las reglas a cada elemento y se unen con ' '.
 *   - Objeto        → se intenta extraer un texto útil:
 *       1. `.message` string (Error / APIError).
 *       2. claves comunes de mensaje: message / detail / msg / error.
 *       3. primer valor "stringificable" del objeto (dict de validación DRF).
 *       4. como último recurso, JSON.stringify — NUNCA "[object Object]".
 *
 * Si nada aporta texto útil, devuelve `fallback`. Jamás devuelve
 * "[object Object]".
 */

const DEFAULT_FALLBACK = 'Ocurrió un error inesperado.';
const MESSAGE_KEYS = ['message', 'detail', 'msg', 'error'];

export function toReadableString(value, fallback = DEFAULT_FALLBACK) {
  const result = extract(value, 0);
  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (trimmed && trimmed !== '[object Object]') return trimmed;
  }
  return fallback;
}

function extract(value, depth) {
  if (value == null) return null;

  const t = typeof value;
  if (t === 'string') return value;
  if (t === 'number' || t === 'boolean') return String(value);
  if (t !== 'object') return null; // function, symbol, bigint, ...

  // Evita recursión ilimitada en estructuras cíclicas o muy profundas.
  if (depth > 4) return safeStringify(value);

  if (Array.isArray(value)) {
    const parts = value
      .map((item) => extract(item, depth + 1))
      .filter((s) => typeof s === 'string' && s.trim());
    return parts.length ? parts.join(' ') : null;
  }

  // Error nativo / APIError: su `.message` es el texto canónico.
  if (typeof value.message === 'string' && value.message.trim()) {
    return value.message;
  }

  // Claves comunes de mensaje (incluye `message` no-string, p.ej. dict DRF).
  for (const key of MESSAGE_KEYS) {
    if (key in value) {
      const inner = extract(value[key], depth + 1);
      if (typeof inner === 'string' && inner.trim()) return inner;
    }
  }

  // Dict de validación DRF: primer valor útil ({campo: ["error"]}).
  for (const v of Object.values(value)) {
    const inner = extract(v, depth + 1);
    if (typeof inner === 'string' && inner.trim()) return inner;
  }

  // Último recurso: JSON legible, jamás "[object Object]".
  return safeStringify(value);
}

function safeStringify(value) {
  try {
    const json = JSON.stringify(value);
    return json && json !== '{}' && json !== '[]' ? json : null;
  } catch {
    return null;
  }
}

export default toReadableString;
