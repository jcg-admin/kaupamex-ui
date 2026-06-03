/**
 * Tests de lib/dateMath — utilidades de fecha puras, sin dependencias.
 *
 * Cada caso ancla el comportamiento documentado en el JSDoc del módulo
 * (reimplementación nativa de @progress/kno-date-math en hora local civil):
 * no-mutación, normalización de fin de mes, e igualdad de fecha.
 */
import {
  addDays,
  addMonths,
  startOfDay,
  endOfDay,
  isSameDay,
  diffDays,
  clampDate,
} from '@lib/dateMath';

describe('lib/dateMath', () => {
  describe('addDays', () => {
    it('suma días sin mutar la entrada', () => {
      const base = new Date(2026, 0, 1);
      const out = addDays(base, 5);
      expect(out).toEqual(new Date(2026, 0, 6));
      expect(base).toEqual(new Date(2026, 0, 1)); // no mutada
    });

    it('resta días con offset negativo (cruza el año)', () => {
      expect(addDays(new Date(2026, 0, 1), -5)).toEqual(new Date(2025, 11, 27));
    });

    it('devuelve null para fecha inválida', () => {
      expect(addDays('no-es-fecha', 1)).toBeNull();
      expect(addDays(null, 1)).toBeNull();
    });
  });

  describe('addMonths', () => {
    it('normaliza el fin de mes (31 ene + 1 mes → 28 feb)', () => {
      expect(addMonths(new Date(2026, 0, 31), 1)).toEqual(new Date(2026, 1, 28));
    });

    it('preserva el día cuando el mes destino lo admite', () => {
      expect(addMonths(new Date(2026, 0, 15), 2)).toEqual(new Date(2026, 2, 15));
    });

    it('no muta la entrada', () => {
      const base = new Date(2026, 0, 31);
      addMonths(base, 1);
      expect(base).toEqual(new Date(2026, 0, 31));
    });
  });

  describe('startOfDay / endOfDay', () => {
    it('startOfDay lleva a medianoche local', () => {
      const out = startOfDay(new Date(2026, 5, 3, 14, 30, 45, 123));
      expect(out.getHours()).toBe(0);
      expect(out.getMinutes()).toBe(0);
      expect(out.getSeconds()).toBe(0);
      expect(out.getMilliseconds()).toBe(0);
      expect(out.getDate()).toBe(3);
    });

    it('endOfDay lleva al último ms del día', () => {
      const out = endOfDay(new Date(2026, 5, 3, 1, 2, 3, 4));
      expect(out.getHours()).toBe(23);
      expect(out.getMinutes()).toBe(59);
      expect(out.getSeconds()).toBe(59);
      expect(out.getMilliseconds()).toBe(999);
    });
  });

  describe('isSameDay', () => {
    it('ignora la hora al comparar la fecha', () => {
      expect(isSameDay(new Date(2026, 0, 1, 8), new Date(2026, 0, 1, 20))).toBe(true);
    });

    it('distingue días distintos', () => {
      expect(isSameDay(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
    });

    it('dos null se consideran iguales; un solo null no', () => {
      expect(isSameDay(null, null)).toBe(true);
      expect(isSameDay(new Date(2026, 0, 1), null)).toBe(false);
    });
  });

  describe('diffDays', () => {
    it('cuenta días civiles ignorando la hora', () => {
      expect(diffDays(new Date(2026, 0, 1, 23), new Date(2026, 0, 3, 1))).toBe(2);
    });

    it('es negativo cuando b precede a a', () => {
      expect(diffDays(new Date(2026, 0, 3), new Date(2026, 0, 1))).toBe(-2);
    });

    it('null si alguna fecha es inválida', () => {
      expect(diffDays('x', new Date(2026, 0, 1))).toBeNull();
    });
  });

  describe('clampDate', () => {
    const min = new Date(2026, 0, 10);
    const max = new Date(2026, 0, 20);

    it('devuelve el límite inferior si está por debajo', () => {
      expect(clampDate(new Date(2026, 0, 5), min, max)).toEqual(min);
    });

    it('devuelve el límite superior si está por encima', () => {
      expect(clampDate(new Date(2026, 0, 25), min, max)).toEqual(max);
    });

    it('devuelve la fecha intacta dentro del rango', () => {
      const d = new Date(2026, 0, 15);
      expect(clampDate(d, min, max)).toEqual(d);
    });

    it('respeta rango abierto cuando un límite es null', () => {
      const d = new Date(2026, 0, 5);
      expect(clampDate(d, null, max)).toEqual(d);
    });
  });
});
