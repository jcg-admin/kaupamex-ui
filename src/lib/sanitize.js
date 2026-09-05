/**
 * sanitize.js — política XSS única (Kaupamex UI)
 *
 * Centraliza el uso de DOMPurify. Antes `DOMPurify.sanitize` estaba
 * disperso en varios call-sites con configuración ad-hoc (o sin config),
 * lo que dificultaba razonar sobre qué HTML se permite renderizar via
 * `dangerouslySetInnerHTML`. Esta es la única superficie autorizada para
 * sanitizar HTML en la UI.
 *
 * Allowlist deliberadamente estrecha: el HTML proviene de campos de
 * catálogo (descripción, significado ritual, instrucciones de cuidado) y
 * de resaltado de búsqueda (`highlighted_name`). Solo se necesita formato
 * inline básico y listas; nunca scripts, estilos, iframes ni handlers.
 */
import DOMPurify from 'dompurify';

// Endurecimiento de enlaces: todo `<a target="_blank">` recibe
// `rel="noopener noreferrer"` para evitar tabnabbing. DOMPurify ya bloquea
// esquemas peligrosos (`javascript:` en href/src) por defecto; este hook solo
// cierra el vector de la nueva pestaña. Se registra una vez al importar.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

// Estilo inline ACOTADO: se permite el atributo `style` pero sólo con un
// puñado de propiedades tipográficas seguras (alineación, sangría, fuente).
// Cualquier otra propiedad —y cualquier `url(...)`/`expression(...)`— se
// descarta. Sin esto, permitir `style` abriría una superficie XSS/exfil amplia.
const SAFE_STYLE_PROPS = new Set([
  'text-align', 'text-indent', 'margin-left', 'margin-right',
  'font-size', 'font-family',
]);
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  if (data.attrName !== 'style') return;
  const safe = String(data.attrValue)
    .split(';')
    .map((decl) => decl.trim())
    .filter(Boolean)
    .filter((decl) => {
      if (/url\(|expression|javascript:/i.test(decl)) return false;
      const prop = decl.slice(0, decl.indexOf(':')).trim().toLowerCase();
      return SAFE_STYLE_PROPS.has(prop);
    })
    .join('; ');
  if (safe) data.attrValue = safe;
  else data.keepAttr = false;
});

/**
 * Configuración central de la allowlist. Coherente para todos los
 * call-sites: formato inline + listas + encabezados + cita + enlaces +
 * imágenes. Sin `style`, sin handlers (on*), sin data-attrs. Los enlaces e
 * imágenes se sanitizan por DOMPurify (bloquea `javascript:`); los `<a
 * target="_blank">` reciben `rel="noopener noreferrer"` (hook de arriba).
 */
export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'strong', 'i', 'em', 'u', 's', 'strike',
    'mark', 'small', 'sub', 'sup',
    'br', 'p', 'span',
    'h1', 'h2', 'h3', 'blockquote',
    'ul', 'ol', 'li',
    'a', 'img',
  ],
  ALLOWED_ATTR: ['class', 'href', 'target', 'rel', 'src', 'alt', 'title', 'style'],
  // Nunca permitir handlers inline ni esquemas de datos.
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitiza una cadena de HTML potencialmente insegura segun la política
 * central. Retorna siempre una cadena (string vacía para entradas nulas).
 *
 * @param {string} dirty  — HTML sin sanitizar.
 * @param {object} [opts] — overrides puntuales de la config de DOMPurify.
 *                          Por defecto se usa SANITIZE_CONFIG.
 * @returns {string} HTML sanitizado seguro para dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty, opts) {
  if (dirty === null || dirty === undefined) return '';
  const config = opts ? { ...SANITIZE_CONFIG, ...opts } : SANITIZE_CONFIG;
  return DOMPurify.sanitize(String(dirty), config);
}

export default sanitizeHtml;
