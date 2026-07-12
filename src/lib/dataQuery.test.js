/**
 * Tests de lib/dataQuery — pipeline puro extraído de DataTable.
 */
import {
  process,
  applyFilter,
  applySort,
  applyPage,
  compareValues,
  rawValue,
  filterBy,
} from '@lib/dataQuery';

const columns = [
  { key: 'name' },
  { key: 'age' },
  { key: 'full', value: (r) => `${r.name} ${r.age}` },
];

const rows = [
  { id: 1, name: 'Beto', age: 30 },
  { id: 2, name: 'Ana', age: 22 },
  { id: 3, name: 'Carla', age: 45 },
  { id: 4, name: 'ana lopez', age: 22 },
];

describe('compareValues', () => {
  it('ordena números por valor', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
  });
  it('ordena fechas por timestamp', () => {
    expect(compareValues(new Date(2020, 0, 1), new Date(2021, 0, 1))).toBeLessThan(0);
  });
  it('null se ordena primero', () => {
    expect(compareValues(null, 5)).toBe(-1);
    expect(compareValues(5, null)).toBe(1);
    expect(compareValues(null, null)).toBe(0);
  });
  it('compara strings con locale numérico', () => {
    expect(compareValues('item2', 'item10')).toBeLessThan(0);
  });
});

describe('rawValue', () => {
  it('usa column.value cuando es función', () => {
    expect(rawValue(rows[0], columns[2])).toBe('Beto 30');
  });
  it('cae a row[key] sin value()', () => {
    expect(rawValue(rows[0], columns[0])).toBe('Beto');
  });
});

describe('applyFilter', () => {
  it('filtra por substring case-insensitive', () => {
    const out = applyFilter(rows, { name: 'ana' }, columns);
    expect(out.map((r) => r.id)).toEqual([2, 4]);
  });
  it('combina filtros con AND', () => {
    const out = applyFilter(rows, { name: 'ana', age: '22' }, columns);
    expect(out.map((r) => r.id)).toEqual([2, 4]);
  });
  it('ignora textos vacíos y devuelve el array original', () => {
    expect(applyFilter(rows, { name: '   ' }, columns)).toBe(rows);
  });
  it('no muta el array original', () => {
    const out = applyFilter(rows, { name: 'ana' }, columns);
    expect(out).not.toBe(rows);
    expect(rows).toHaveLength(4);
  });
});

describe('applySort', () => {
  it('ordena ascendente por columna', () => {
    const out = applySort(rows, { key: 'age', dir: 'asc' }, columns);
    expect(out.map((r) => r.age)).toEqual([22, 22, 30, 45]);
  });
  it('ordena descendente', () => {
    const out = applySort(rows, { key: 'age', dir: 'desc' }, columns);
    expect(out.map((r) => r.age)).toEqual([45, 30, 22, 22]);
  });
  it('no muta el array original', () => {
    const out = applySort(rows, { key: 'age', dir: 'asc' }, columns);
    expect(out).not.toBe(rows);
    expect(rows[0].id).toBe(1);
  });
  it('devuelve el array tal cual sin sort o columna inexistente', () => {
    expect(applySort(rows, null, columns)).toBe(rows);
    expect(applySort(rows, { key: 'nope', dir: 'asc' }, columns)).toBe(rows);
  });
});

describe('applyPage', () => {
  it('corta la página solicitada', () => {
    expect(applyPage(rows, 1, 2).map((r) => r.id)).toEqual([1, 2]);
    expect(applyPage(rows, 2, 2).map((r) => r.id)).toEqual([3, 4]);
  });
  it('pageSize <= 0 devuelve todo sin paginar', () => {
    expect(applyPage(rows, 1, 0)).toBe(rows);
  });
  it('normaliza página < 1', () => {
    expect(applyPage(rows, 0, 2).map((r) => r.id)).toEqual([1, 2]);
  });
});

describe('process', () => {
  it('aplica filter → sort → page y reporta el total pre-paginación', () => {
    const result = process(rows, {
      filters: { name: 'a' },
      sort: { key: 'age', dir: 'desc' },
      page: 1,
      pageSize: 2,
      columns,
    });
    // 'a' matchea Ana, Carla, ana lopez (no Beto) → total 3
    expect(result.total).toBe(3);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].age).toBe(45); // desc → Carla primero
  });
  it('sin opciones devuelve los datos sin transformar', () => {
    const result = process(rows);
    expect(result.data).toBe(rows);
    expect(result.total).toBe(4);
  });
});

describe('filterBy (contrato kno FilterDescriptor)', () => {
  const paises = [
    { id: 'mx', name: 'México' },
    { id: 'us', name: 'Estados Unidos' },
    { id: 'ar', name: 'Argentina' },
    { id: 'br', name: 'Brasil' },
  ];

  it('sin descriptor devuelve los datos intactos', () => {
    expect(filterBy(paises, null)).toBe(paises);
    expect(filterBy(paises, undefined)).toBe(paises);
  });

  it('composite vacío devuelve los datos intactos', () => {
    expect(filterBy(paises, { logic: 'and', filters: [] })).toBe(paises);
  });

  it('contains con ignoreCase por defecto', () => {
    const r = filterBy(paises, { field: 'name', operator: 'contains', value: 'bra' });
    expect(r.map((p) => p.id)).toEqual(['br']);
  });

  it('startswith filtra por prefijo', () => {
    const r = filterBy(paises, { field: 'name', operator: 'startswith', value: 'A' });
    expect(r.map((p) => p.id)).toEqual(['ar']);
  });

  it('endswith filtra por sufijo', () => {
    const r = filterBy(paises, { field: 'name', operator: 'endswith', value: 'dos' });
    expect(r.map((p) => p.id)).toEqual(['us']);
  });

  it('eq con ignoreCase:false distingue mayúsculas', () => {
    const r = filterBy(paises, {
      field: 'name', operator: 'eq', value: 'méxico', ignoreCase: false,
    });
    expect(r).toEqual([]);
  });

  it('opera sobre arrays de strings cuando no hay field', () => {
    const r = filterBy(['Rojo', 'Verde', 'Azul'], { operator: 'contains', value: 'erd' });
    expect(r).toEqual(['Verde']);
  });

  it('composite OR combina descriptores', () => {
    const r = filterBy(paises, {
      logic: 'or',
      filters: [
        { field: 'name', operator: 'contains', value: 'méxico' },
        { field: 'name', operator: 'contains', value: 'brasil' },
      ],
    });
    expect(r.map((p) => p.id).sort()).toEqual(['br', 'mx']);
  });

  it('accede a campos anidados por path', () => {
    const data = [{ geo: { estado: 'Jalisco' } }, { geo: { estado: 'Nuevo León' } }];
    const r = filterBy(data, { field: 'geo.estado', operator: 'startswith', value: 'jal' });
    expect(r).toHaveLength(1);
  });
});
