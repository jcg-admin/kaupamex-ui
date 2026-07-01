/**
 * toReadableString — pruebas unitarias
 *
 * Regresion cerrada: un `message` que NO es string (dict de validacion DRF,
 * objeto, Error) jamas debe coercerse al literal "[object Object]".
 */
import { toReadableString } from './toReadableString';

describe('toReadableString', () => {
  it('devuelve un string tal cual (con trim)', () => {
    expect(toReadableString('Hola')).toBe('Hola');
    expect(toReadableString('  espacios  ')).toBe('espacios');
  });

  it('usa el fallback para null/undefined/vacio', () => {
    expect(toReadableString(null, 'fb')).toBe('fb');
    expect(toReadableString(undefined, 'fb')).toBe('fb');
    expect(toReadableString('', 'fb')).toBe('fb');
    expect(toReadableString('   ', 'fb')).toBe('fb');
  });

  it('coacciona number y boolean', () => {
    expect(toReadableString(42)).toBe('42');
    expect(toReadableString(false)).toBe('false');
  });

  it('NUNCA devuelve "[object Object]" para un objeto plano', () => {
    const out = toReadableString({ foo: 'bar' });
    expect(out).not.toBe('[object Object]');
    expect(out).toContain('bar');
  });

  it('extrae el primer valor util de un dict de validacion DRF', () => {
    const drf = { email: ['Ya existe una cuenta con este correo.'] };
    expect(toReadableString(drf)).toBe('Ya existe una cuenta con este correo.');
  });

  it('prefiere claves de mensaje comunes (detail/message)', () => {
    expect(toReadableString({ detail: 'No encontrado' })).toBe('No encontrado');
    expect(toReadableString({ message: 'Boom', code: 'X' })).toBe('Boom');
  });

  it('aplana arrays a texto legible', () => {
    expect(toReadableString(['a', 'b'])).toBe('a b');
    expect(toReadableString([{ x: 'uno' }, 'dos'])).toBe('uno dos');
  });

  it('extrae el message de un Error nativo', () => {
    expect(toReadableString(new Error('kaboom'))).toBe('kaboom');
  });

  it('cae al fallback si el objeto no aporta texto util', () => {
    expect(toReadableString({}, 'fb')).toBe('fb');
    expect(toReadableString([], 'fb')).toBe('fb');
  });
});
