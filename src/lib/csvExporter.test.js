/**
 * Tests — csvExporter.js
 */
jest.mock('./fileSaver', () => ({
  saveAs: jest.fn(),
}));

import { toCsvString, exportToCsv } from './csvExporter';
import { saveAs } from './fileSaver';

const COLUMNS = [
  { key: 'name',  header: 'Nombre' },
  { key: 'price', header: 'Precio' },
  { key: 'notes', header: 'Notas' },
];

afterEach(() => jest.clearAllMocks());

describe('toCsvString', () => {
  it('genera encabezados y filas separados por CRLF', () => {
    const rows = [{ name: 'Collar', price: 100, notes: '' }];
    const csv = toCsvString(COLUMNS, rows);
    const lines = csv.replace(/^﻿/, '').split('\r\n');
    expect(lines[0]).toBe('Nombre,Precio,Notas');
    expect(lines[1]).toBe('Collar,100,');
  });

  it('incluye BOM UTF-8 al inicio', () => {
    const csv = toCsvString(COLUMNS, []);
    expect(csv.charCodeAt(0)).toBe(0xFEFF);
  });

  it('escapa comillas doblándolas', () => {
    const rows = [{ name: 'Producto "A"', price: 50, notes: '' }];
    const csv = toCsvString(COLUMNS, rows);
    expect(csv).toContain('"Producto ""A"""');
  });

  it('envuelve en comillas celdas con coma', () => {
    const rows = [{ name: 'Collar, pulsera', price: 0, notes: '' }];
    const csv = toCsvString(COLUMNS, rows);
    expect(csv).toContain('"Collar, pulsera"');
  });

  it('convierte null/undefined a cadena vacía', () => {
    const rows = [{ name: null, price: undefined, notes: 'ok' }];
    const csv = toCsvString(COLUMNS, rows);
    const dataLine = csv.replace(/^﻿/, '').split('\r\n')[1];
    expect(dataLine).toBe(',,ok');
  });
});

describe('exportToCsv', () => {
  it('llama a saveAs con un Blob de tipo text/csv', () => {
    const rows = [{ name: 'Item', price: 99, notes: '' }];
    exportToCsv(COLUMNS, rows, 'inventario.csv');
    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, filename] = saveAs.mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toMatch(/text\/csv/);
    expect(filename).toBe('inventario.csv');
  });
});
