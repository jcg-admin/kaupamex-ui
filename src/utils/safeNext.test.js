/**
 * Tests — safeNext (guard anti open-redirect del ?next= post-auth).
 */
import { safeNext, fromLocation } from './safeNext';

describe('safeNext', () => {
  it('acepta rutas internas relativas', () => {
    expect(safeNext('/cart')).toBe('/cart');
    expect(safeNext('/catalog?cat=collares')).toBe('/catalog?cat=collares');
    expect(safeNext('/account/orders')).toBe('/account/orders');
  });

  it('rechaza URLs absolutas / esquemas externos', () => {
    expect(safeNext('http://malo.com')).toBeNull();
    expect(safeNext('https://malo.com/x')).toBeNull();
    expect(safeNext('javascript:alert(1)')).toBeNull();
    expect(safeNext('data:text/html,x')).toBeNull();
  });

  it('rechaza protocol-relative //host', () => {
    expect(safeNext('//malo.com')).toBeNull();
    expect(safeNext('//malo.com/path')).toBeNull();
  });

  it('rechaza rutas que no empiezan con /', () => {
    expect(safeNext('cart')).toBeNull();
    expect(safeNext('../etc')).toBeNull();
  });

  it('rechaza trucos con backslash o dos puntos', () => {
    expect(safeNext('/\\malo')).toBeNull();
    expect(safeNext('/path:with:colon')).toBeNull();
  });

  it('rechaza valores vacios / no-string', () => {
    expect(safeNext('')).toBeNull();
    expect(safeNext(null)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
    expect(safeNext(42)).toBeNull();
  });
});

describe('fromLocation', () => {
  it('serializa pathname + search', () => {
    expect(fromLocation({ pathname: '/catalog', search: '?cat=x' })).toBe('/catalog?cat=x');
    expect(fromLocation({ pathname: '/cart', search: '' })).toBe('/cart');
    expect(fromLocation({ pathname: '/cart' })).toBe('/cart');
  });

  it('devuelve null para location invalido', () => {
    expect(fromLocation(null)).toBeNull();
    expect(fromLocation({})).toBeNull();
  });
});
