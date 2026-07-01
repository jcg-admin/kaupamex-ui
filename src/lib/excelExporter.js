/**
 * excelExporter.js — PracticaYoruba UI
 *
 * Exportación client-side a Excel SIN dependencias (ni SheetJS ni zip):
 * genera SpreadsheetML 2003 (XML de Excel, extensión .xls) que Excel y
 * LibreOffice abren nativamente. Aporta sobre el CSV existente:
 *   - celdas TIPADAS (números como número, no texto) → sumas/fórmulas directas
 *   - múltiples hojas en un archivo (resumen + detalle)
 *
 * UC-ADM-03: complementa src/lib/csvExporter.js (no lo reemplaza) para las
 * tablas admin que hoy solo exportan CSV client-side (inventario, órdenes).
 * Los reportes grandes siguen usando el export XLSX async del server (DRY).
 *
 * Atribución: concepto de kno-react-excel-export / kno-ooxml (export tabular a
 * Excel), reimplementado nativo con SpreadsheetML en vez de OOXML+zip.
 *
 * @typedef {{ key: string, header: string, type?: ('number'|'string') }} Column
 * @typedef {{ name?: string, columns: Column[], rows: object[] }} Sheet
 */
import { saveAs } from './fileSaver';

function escapeXml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cellXml(value, type) {
  const isNumber = type === 'number'
    || (type !== 'string' && typeof value === 'number' && Number.isFinite(value));
  if (isNumber && value !== '' && value != null) {
    return `<Cell><Data ss:Type="Number">${escapeXml(value)}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function sheetXml({ name = 'Hoja1', columns, rows }) {
  const header = columns.map((c) => cellXml(c.header, 'string')).join('');
  const body = rows.map((row) =>
    `<Row>${columns.map((c) => cellXml(row[c.key], c.type)).join('')}</Row>`,
  ).join('');
  // El nombre de hoja de Excel no admite : \ / ? * [ ] y máx 31 chars.
  const safeName = escapeXml(String(name).replace(/[:\\/?*[\]]/g, ' ').slice(0, 31));
  return `<Worksheet ss:Name="${safeName}"><Table>`
    + `<Row>${header}</Row>${body}</Table></Worksheet>`;
}

/**
 * Construye el XML SpreadsheetML de una o varias hojas.
 * @param {Sheet[]} sheets
 * @returns {string}
 */
export function toExcelXml(sheets) {
  const worksheets = sheets.map(sheetXml).join('');
  return '<?xml version="1.0" encoding="UTF-8"?>'
    + '<?mso-application progid="Excel.Sheet"?>'
    + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'
    + ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">'
    + worksheets
    + '</Workbook>';
}

/**
 * Exporta una sola hoja como archivo Excel descargable.
 * @param {Column[]} columns
 * @param {object[]} rows
 * @param {string} filename — incluir extensión (.xls)
 * @param {{ sheetName?: string }} [opts]
 */
export function exportToExcel(columns, rows, filename, opts = {}) {
  const xml = toExcelXml([{ name: opts.sheetName, columns, rows }]);
  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  saveAs(blob, filename);
}

/**
 * Exporta varias hojas (resumen + detalle) a un archivo Excel.
 * @param {Sheet[]} sheets
 * @param {string} filename
 */
export function exportSheetsToExcel(sheets, filename) {
  const blob = new Blob([toExcelXml(sheets)], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  saveAs(blob, filename);
}

export default exportToExcel;
