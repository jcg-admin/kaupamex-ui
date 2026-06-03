/**
 * fileSaver.js — descarga de blobs en el navegador (PracticaYoruba UI)
 *
 * Reimplementación nativa del patrón de descarga client-side. Adaptado de
 * `@progress/kno-file-saver` (`dist/es/save-as.js`, función `saveAs` →
 * `saveAsDataURI`): crea un ancla `<a download>`, le asigna un objectURL
 * del blob, dispara el click y revoca el objectURL. Sin dependencia nueva
 * — solo APIs del navegador (Blob, URL, anchor).
 *
 * Atribución: patrón portado de @progress/kno-file-saver (saveAsDataURI).
 * Se omite la rama legacy `navigator.msSaveBlob` (IE/Edge legado) y la
 * rama de proxy server-side, que no aplican a este proyecto.
 *
 * Nota: no se integra todavía en páginas. Queda listo para los exports
 * client-side. Los exports actuales server-side (buildReportExportUrl)
 * no cambian.
 */

/**
 * Guarda un Blob como descarga con el nombre indicado.
 *
 * @param {Blob} blob      — contenido a descargar.
 * @param {string} filename — nombre de archivo sugerido al navegador.
 */
export function saveAs(blob, filename) {
  if (!(blob instanceof Blob)) {
    throw new TypeError('saveAs: el primer argumento debe ser un Blob');
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'download';
  // rel=noopener: ancla efímera, defensa estándar al abrir/descargar.
  anchor.rel = 'noopener';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // Revocar el objectURL tras el tick actual para no cortar la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Helper de conveniencia: construye un Blob desde datos crudos y lo
 * descarga. Útil para exports client-side (CSV, JSON, texto).
 *
 * @param {BlobPart|BlobPart[]} data — contenido (string, ArrayBuffer, etc.).
 * @param {string} filename          — nombre de archivo sugerido.
 * @param {string} [mimeType]        — tipo MIME (default text/plain;charset=utf-8).
 */
export function downloadFromBlob(data, filename, mimeType = 'text/plain;charset=utf-8') {
  const parts = Array.isArray(data) ? data : [data];
  const blob = new Blob(parts, { type: mimeType });
  saveAs(blob, filename);
}

export default saveAs;
