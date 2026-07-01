/**
 * cx — pruebas unitarias
 */
import { cx } from '@utils/cx';

describe('cx', () => {
  it('une strings con espacio', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c');
  });

  it('ignora valores falsy (false/null/undefined/vacio/0)', () => {
    expect(cx('a', false, null, undefined, '', 0, 'b')).toBe('a b');
  });

  it('soporta el patron cond && clase', () => {
    const cond = false;
    expect(cx('a', cond && 'active', 'b')).toBe('a b');
    expect(cx('a', true && 'active')).toBe('a active');
  });

  it('soporta objetos { clase: booleano }', () => {
    expect(cx('a', { on: true, off: false })).toBe('a on');
  });

  it('aplana arrays anidados', () => {
    expect(cx(['a', 'b'], 'c')).toBe('a b c');
    expect(cx('a', ['b', { c: true, d: false }])).toBe('a b c');
  });

  it('sin args devuelve string vacio', () => {
    expect(cx()).toBe('');
  });

  it('nunca inyecta el literal "false" (anti-patron)', () => {
    const cond = false;
    // El bug clasico: `${cond && styles.x}` -> "false". cx lo evita.
    expect(cx('btn', cond && 'btn--active')).not.toContain('false');
  });
});
