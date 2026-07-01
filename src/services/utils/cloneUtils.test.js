/**
 * cloneData — pruebas unitarias (structuredClone nativo)
 */
import { cloneData } from '@services/utils/cloneUtils';

describe('cloneData', () => {
  it('clona en profundidad: mutar la copia no afecta al original', () => {
    const orig = { a: { b: 1 }, list: [1, 2] };
    const copy = cloneData(orig);
    copy.a.b = 99;
    copy.list.push(3);
    expect(orig.a.b).toBe(1);
    expect(orig.list).toEqual([1, 2]);
  });

  it('preserva Date (structuredClone, no el hack JSON)', () => {
    const d = new Date('2026-01-01T00:00:00Z');
    const copy = cloneData({ when: d });
    expect(copy.when instanceof Date).toBe(true);
    expect(copy.when.getTime()).toBe(d.getTime());
  });
});
