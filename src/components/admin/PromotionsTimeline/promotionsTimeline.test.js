/**
 * promotionsTimeline — cálculo puro del timeline (determinista).
 */
import {
  parseDate, computeRange, computeBars, nowMarkerPct, axisTicks,
} from './promotionsTimeline';

const NOW = Date.parse('2026-07-15T00:00:00Z');
const D = (s) => `2026-${s}T00:00:00Z`;

const PROMOS = [
  { id: 1, label: 'VERANO', valid_from: D('07-01'), valid_until: D('07-31') }, // activa el 15
  { id: 2, label: 'FUTURA', valid_from: D('08-01'), valid_until: D('08-15') }, // futura
  { id: 3, label: 'PASADA', valid_from: D('06-01'), valid_until: D('06-10') }, // pasada
];

describe('parseDate', () => {
  it('parsea ISO y rechaza null/inválido', () => {
    expect(parseDate(D('07-01'))).toBe(Date.parse(D('07-01')));
    expect(parseDate(null)).toBeNull();
    expect(parseDate('no-fecha')).toBeNull();
  });
});

describe('computeRange', () => {
  it('cubre min(from)..max(until) con padding', () => {
    const { start, end } = computeRange(PROMOS, { now: NOW, padDays: 0 });
    expect(start).toBe(Date.parse(D('06-01')));
    expect(end).toBe(Date.parse(D('08-15')));
  });
  it('sin fechas usa now..now+fallback', () => {
    const { start, end } = computeRange([{ id: 9, label: 'X' }], { now: NOW, padDays: 0, fallbackSpanDays: 10 });
    expect(start).toBe(NOW);
    expect(end).toBe(NOW + 10 * 86400000);
  });
});

describe('computeBars', () => {
  const range = computeRange(PROMOS, { now: NOW, padDays: 0 });
  const bars = computeBars(PROMOS, { ...range, now: NOW });

  it('marca active solo la promo vigente hoy', () => {
    expect(bars.find((b) => b.id === 1).active).toBe(true);
    expect(bars.find((b) => b.id === 2).active).toBe(false);
    expect(bars.find((b) => b.id === 3).active).toBe(false);
  });

  it('left/width en % dentro de [0,100] y ordenados en el tiempo', () => {
    const b1 = bars.find((b) => b.id === 1);
    const b2 = bars.find((b) => b.id === 2);
    const b3 = bars.find((b) => b.id === 3);
    // PASADA arranca en el borde izquierdo (start del rango)
    expect(b3.leftPct).toBeCloseTo(0, 5);
    // FUTURA está a la derecha de VERANO
    expect(b2.leftPct).toBeGreaterThan(b1.leftPct);
    bars.forEach((b) => {
      expect(b.leftPct).toBeGreaterThanOrEqual(0);
      expect(b.leftPct + b.widthPct).toBeLessThanOrEqual(100.001);
    });
  });

  it('una promo SIN fechas no se dibuja (visible=false)', () => {
    const [bar] = computeBars([{ id: 7, label: 'SIN_FECHAS' }], { ...range, now: NOW });
    expect(bar.visible).toBe(false);
  });

  it('valid_until nulo se extiende hasta el fin del rango', () => {
    const range2 = computeRange([{ id: 5, label: 'ABIERTA', valid_from: D('07-10') }], { now: NOW, padDays: 0 });
    const [bar] = computeBars([{ id: 5, label: 'ABIERTA', valid_from: D('07-10') }], { ...range2, now: NOW });
    expect(bar.visible).toBe(true);
    expect(bar.leftPct + bar.widthPct).toBeCloseTo(100, 1);
  });
});

describe('nowMarkerPct / axisTicks', () => {
  it('marcador dentro del rango da un % válido', () => {
    const range = computeRange(PROMOS, { now: NOW, padDays: 0 });
    const pct = nowMarkerPct({ ...range, now: NOW });
    expect(pct).toBeGreaterThan(0);
    expect(pct).toBeLessThan(100);
  });
  it('marcador fuera del rango es null', () => {
    expect(nowMarkerPct({ start: NOW + 1000, end: NOW + 2000, now: NOW })).toBeNull();
  });
  it('axisTicks devuelve count+1 marcas', () => {
    const range = computeRange(PROMOS, { now: NOW, padDays: 0 });
    expect(axisTicks(range, 6)).toHaveLength(7);
  });
});
