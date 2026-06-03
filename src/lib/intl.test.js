/**
 * Tests de lib/intl — formateo i18n nativo, sin dependencias.
 *
 * Cada caso ancla el comportamiento documentado en el JSDoc del módulo
 * (reimplementación nativa de @progress/kno-intl sobre el Intl del
 * navegador): defaults es-MX / MXN, null/NaN-safety, y delegación al
 * Intl nativo para moneda, número, porcentaje, fecha y fecha-hora.
 *
 * Determinismo: el Intl nativo inserta separadores que varían entre
 * versiones de Node/ICU (espacios duros U+00A0, U+202F). `normalize`
 * colapsa todo espacio Unicode a un espacio ASCII para que las
 * aserciones sean estables entre entornos. Los locales se fijan
 * explícitamente en cada caso para no depender del locale del runtime.
 */
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatDateTime,
} from '@lib/intl';
import intl from '@lib/intl';

/** Colapsa cualquier espacio Unicode (incl. NBSP/NNBSP) a espacio ASCII. */
const normalize = (s) => s.replace(/\s/g, ' ');

describe('lib/intl', () => {
  describe('formatCurrency', () => {
    it('formatea MXN por defecto (es-MX) con 2 decimales', () => {
      // El símbolo de MXN en es-MX es "$"; se valida estructura, no el glyph.
      const out = normalize(formatCurrency(1234.5));
      expect(out).toContain('$');
      expect(out).toContain('1,234.50');
    });

    it('respeta currency override (USD) manteniendo el locale', () => {
      const out = normalize(formatCurrency(1234.5, { currency: 'USD' }));
      expect(out).toContain('1,234.50');
      expect(out).toMatch(/USD|\$/);
    });

    it('acepta strings numéricas parseables', () => {
      expect(normalize(formatCurrency('99.9'))).toContain('99.90');
    });

    it('devuelve "" para null/undefined/""', () => {
      expect(formatCurrency(null)).toBe('');
      expect(formatCurrency(undefined)).toBe('');
      expect(formatCurrency('')).toBe('');
    });

    it('devuelve "" para valores no numéricos (NaN)', () => {
      expect(formatCurrency('no-es-numero')).toBe('');
      expect(formatCurrency(NaN)).toBe('');
      expect(formatCurrency(Infinity)).toBe('');
    });

    it('formatea cero correctamente (no lo trata como ausencia)', () => {
      expect(normalize(formatCurrency(0))).toContain('0.00');
    });
  });

  describe('formatNumber', () => {
    it('agrupa miles y conserva decimales (en-US determinista)', () => {
      expect(normalize(formatNumber(1234567.89, { locale: 'en-US' })))
        .toBe('1,234,567.89');
    });

    it('aplica minimumFractionDigits', () => {
      expect(normalize(formatNumber(1234, { locale: 'en-US', minimumFractionDigits: 2 })))
        .toBe('1,234.00');
    });

    it('devuelve "" para null/NaN', () => {
      expect(formatNumber(null)).toBe('');
      expect(formatNumber('x')).toBe('');
    });
  });

  describe('formatPercent', () => {
    it('trata el input como fracción (0.2 → 20%)', () => {
      expect(normalize(formatPercent(0.2, { locale: 'en-US' }))).toBe('20%');
    });

    it('respeta maximumFractionDigits', () => {
      expect(normalize(formatPercent(0.1234, { locale: 'en-US', maximumFractionDigits: 1 })))
        .toBe('12.3%');
    });

    it('devuelve "" para null/NaN', () => {
      expect(formatPercent(null)).toBe('');
      expect(formatPercent(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('usa estilo long por defecto en es-MX', () => {
      // Fecha construida en hora local para evitar desfase de zona.
      const d = new Date(2026, 4, 5); // 5 de mayo de 2026
      const out = formatDate(d);
      expect(out).toContain('2026');
      expect(out.toLowerCase()).toContain('mayo');
      expect(out).toContain('5');
    });

    it('acepta opciones de componente explícitas (en-US determinista)', () => {
      const d = new Date(2026, 4, 5);
      expect(formatDate(d, {
        locale: 'en-US', day: '2-digit', month: '2-digit', year: 'numeric',
      })).toBe('05/05/2026');
    });

    it('acepta ISO string parseable', () => {
      const out = formatDate('2026-05-05T00:00:00', {
        locale: 'en-US', day: '2-digit', month: '2-digit', year: 'numeric',
      });
      expect(out).toBe('05/05/2026');
    });

    it('devuelve "" para null o fecha inválida', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate('no-es-fecha')).toBe('');
      expect(formatDate('')).toBe('');
    });
  });

  describe('formatDateTime', () => {
    it('incluye fecha y hora con componentes por defecto', () => {
      const d = new Date(2026, 4, 5, 14, 30, 0);
      const out = normalize(formatDateTime(d, { locale: 'en-US' }));
      expect(out).toContain('05/05/2026');
      // Hora con minuto; el formato 12/24h depende del locale, se valida 14/02.
      expect(out).toMatch(/(14:30|02:30)/);
    });

    it('respeta opciones explícitas', () => {
      const d = new Date(2026, 4, 5, 9, 5, 0);
      const out = normalize(formatDateTime(d, {
        locale: 'en-US', hour: '2-digit', minute: '2-digit', hour12: false,
      }));
      expect(out).toBe('09:05');
    });

    it('devuelve "" para null o inválido', () => {
      expect(formatDateTime(null)).toBe('');
      expect(formatDateTime('nope')).toBe('');
    });
  });

  describe('default export', () => {
    it('agrega las exportaciones nombradas', () => {
      expect(intl.formatCurrency).toBe(formatCurrency);
      expect(intl.formatNumber).toBe(formatNumber);
      expect(intl.formatPercent).toBe(formatPercent);
      expect(intl.formatDate).toBe(formatDate);
      expect(intl.formatDateTime).toBe(formatDateTime);
    });
  });
});
