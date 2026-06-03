/**
 * Tests — dateRange (conversion Date ↔ YYYY-MM-DD local)
 * Soporta la integracion de DateRangePicker en filtros admin (B2).
 */
import { toISODateString, fromISODateString } from './dateRange';

describe('toISODateString', () => {
  it('formatea un Date local a YYYY-MM-DD sin desfase de zona', () => {
    expect(toISODateString(new Date(2026, 4, 5))).toBe('2026-05-05');
    expect(toISODateString(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(toISODateString(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('devuelve cadena vacia para null/undefined/fecha invalida', () => {
    expect(toISODateString(null)).toBe('');
    expect(toISODateString(undefined)).toBe('');
    expect(toISODateString(new Date('no-es-fecha'))).toBe('');
  });
});

describe('fromISODateString', () => {
  it('parsea YYYY-MM-DD a un Date local de medianoche', () => {
    const d = fromISODateString('2026-05-05');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(5);
  });

  it('devuelve null para cadena vacia o invalida', () => {
    expect(fromISODateString('')).toBeNull();
    expect(fromISODateString(null)).toBeNull();
    expect(fromISODateString('basura')).toBeNull();
  });

  it('es inverso de toISODateString (round-trip)', () => {
    expect(toISODateString(fromISODateString('2026-07-19'))).toBe('2026-07-19');
  });
});
