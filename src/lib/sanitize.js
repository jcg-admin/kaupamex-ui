/**
 * sanitize.js — política XSS única (PracticaYoruba UI)
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

/**
 * Configuración central de la allowlist. Coherente para todos los
 * call-sites: etiquetas de formato inline + listas + saltos de línea.
 * Sin atributos peligrosos (on*, style, etc.) y sin URIs de datos.
 */
export const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'strong', 'i', 'em', 'u', 's',
    'mark', 'small', 'sub', 'sup',
    'br', 'p', 'span',
    'ul', 'ol', 'li',
  ],
  ALLOWED_ATTR: ['class'],
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
