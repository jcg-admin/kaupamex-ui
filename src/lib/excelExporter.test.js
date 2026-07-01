/**
 * excelExporter — SpreadsheetML (Excel XML) sin dependencias.
 */
import { toExcelXml } from './excelExporter';

const COLS = [
  { key: 'sku', header: 'SKU' },
  { key: 'stock', header: 'Stock', type: 'number' },
];
const ROWS = [
  { sku: 'ELE-001', stock: 12 },
  { sku: 'OTA-002', stock: 0 },
];

describe('toExcelXml', () => {
  it('genera un Workbook SpreadsheetML válido con la cabecera Excel', () => {
    const xml = toExcelXml([{ name: 'Inventario', columns: COLS, rows: ROWS }]);
    expect(xml).toContain('<?mso-application progid="Excel.Sheet"?>');
    expect(xml).toContain('urn:schemas-microsoft-com:office:spreadsheet');
    expect(xml).toContain('ss:Name="Inventario"');
  });

  it('tipa las celdas: número como Number, texto como String', () => {
    const xml = toExcelXml([{ columns: COLS, rows: ROWS }]);
    expect(xml).toContain('<Data ss:Type="String">ELE-001</Data>');
    expect(xml).toContain('<Data ss:Type="Number">12</Data>');
    // stock 0 sigue siendo número (no se degrada a texto vacío)
    expect(xml).toContain('<Data ss:Type="Number">0</Data>');
  });

  it('escapa XML en valores (& < > " \')', () => {
    const xml = toExcelXml([{
      columns: [{ key: 'n', header: 'Nombre' }],
      rows: [{ n: 'Elekes & <Otá> "grande"' }],
    }]);
    expect(xml).toContain('Elekes &amp; &lt;Otá&gt; &quot;grande&quot;');
    expect(xml).not.toContain('<Otá>');
  });

  it('soporta múltiples hojas', () => {
    const xml = toExcelXml([
      { name: 'Resumen', columns: COLS, rows: [ROWS[0]] },
      { name: 'Detalle', columns: COLS, rows: ROWS },
    ]);
    expect(xml).toContain('ss:Name="Resumen"');
    expect(xml).toContain('ss:Name="Detalle"');
    expect((xml.match(/<Worksheet/g) || []).length).toBe(2);
  });

  it('sanea nombres de hoja inválidos (caracteres y longitud)', () => {
    const xml = toExcelXml([{ name: 'a/b:c*d'.padEnd(40, 'x'), columns: COLS, rows: [] }]);
    const m = xml.match(/ss:Name="([^"]*)"/);
    expect(m[1]).not.toMatch(/[:\\/?*[\]]/);
    expect(m[1].length).toBeLessThanOrEqual(31);
  });
});
