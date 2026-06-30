/**
 * safeNext — guarda anti open-redirect para el destino post-auth (`?next=`).
 *
 * Equivalente en el SPA de `is_safe_url` de Django: solo acepta rutas
 * INTERNAS relativas, para que un `?next=` manipulado no pueda redirigir a
 * un sitio externo (`http://malo`, `//malo`) ni ejecutar `javascript:`.
 *
 * Reglas: debe empezar con un unico `/`, no `//`, sin `:` ni `\`.
 * Devuelve la ruta si es segura, o `null` si no lo es (el caller decide el
 * fallback, p.ej. `/account`).
 */
export function safeNext(raw) {
  if (typeof raw !== 'string' || raw === '') return null;
  if (!raw.startsWith('/')) return null;     // no absoluta / esquema externo
  if (raw.startsWith('//')) return null;     // protocol-relative (//host)
  if (raw.includes(':')) return null;        // http:, javascript:, data:
  if (raw.includes('\\')) return null;       // trucos con backslash
  return raw;
}

/**
 * fromLocation — serializa un objeto location de react-router a una ruta
 * interna (`pathname` + `search`) apta para usar como `next`.
 */
export function fromLocation(location) {
  if (!location || typeof location.pathname !== 'string') return null;
  return `${location.pathname}${location.search || ''}`;
}
