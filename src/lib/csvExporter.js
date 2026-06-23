/**
 * csvExporter.js — PracticaYoruba UI
 *
 * Exportación client-side de arrays a CSV con descarga inmediata.
 * Reimplementación nativa del patrón de @progress/kno-csv (dist/es/csv.js):
 *   encabezados + filas, CRLF (\r\n), escape de comillas (doblar "") y
 *   celdas que contienen coma, BOM UTF-8 (﻿) para compatibilidad Excel.
 *
 * Atribución: patrón portado de @progress/kno-csv (exportCSVToBlob,
 * toCSV, escapeCSVValue). Simplificado: sin datos agrupados, sin
 * separador de lista configurable.
 */
import { saveAs } from './fileSaver';

const CRLF = '\r\n';

function escapeCell(value) {
  const str = value == null ? '' : String(value);
  // Wrap in quotes if the value contains a comma, quote, or newline.
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convierte columnas + filas a un CSV string con BOM UTF-8.
 *
 * @param {Array<{key: string, header: string}>} columns
 * @param {Array<object>} rows
 * @returns {string}
 */
export function toCsvString(columns, rows) {
  const headers = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCell(row[c.key])).join(','),
  ).join(CRLF);
  return `﻿${headers}${CRLF}${body}`;
}

/**
 * Exporta columnas + filas como archivo CSV descargable.
 *
 * @param {Array<{key: string, header: string}>} columns
 * @param {Array<object>} rows
 * @param {string} filename — nombre del archivo (incluir .csv)
 */
export function exportToCsv(columns, rows, filename) {
  const csv = toCsvString(columns, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
}

export default exportToCsv;
