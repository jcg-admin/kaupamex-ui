/**
 * createErrorFromResponse — mensaje legible con errores anidados.
 *
 * Regresión /checkout: la validación de la dirección devuelve errores de un
 * serializer ANIDADO (`{address: {zip_code: ["..."]}}`). El primer field-error
 * era un objeto, y `new Error(objeto)` lo volvía el literal "[object Object]",
 * que terminaba pintado en el banner del checkout. El mensaje debe ser el texto
 * útil, no "[object Object]".
 */
import { createErrorFromResponse } from '@utils/apiErrors';
import { serializeApiError as serialize } from '@utils/serializeApiError';

describe('createErrorFromResponse — mensaje legible', () => {
  it('aplana un error de serializer anidado (address.zip_code)', () => {
    const err = createErrorFromResponse({
      status: 400,
      data: { address: { zip_code: ['El C.P. no está cubierto por ninguna zona.'] } },
    });
    expect(err.message).not.toBe('[object Object]');
    expect(err.message).toContain('no está cubierto');
  });

  it('conserva un field-error plano (email)', () => {
    const err = createErrorFromResponse({
      status: 400,
      data: { email: ['Ya existe una cuenta con este correo.'] },
    });
    expect(err.message).toContain('Ya existe una cuenta');
  });

  it('respeta detail cuando el API lo envía', () => {
    const err = createErrorFromResponse({
      status: 409,
      data: { detail: 'Stock insuficiente.' },
    });
    expect(err.message).toBe('Stock insuficiente.');
  });

  it('el error anidado, ya serializado para el thunk, es un string legible', () => {
    // Camino real de /checkout: createErrorFromResponse -> unwrap -> submitError
    const apiErr = createErrorFromResponse({
      status: 400,
      data: { address: { zip_code: ['El C.P. no está cubierto por ninguna zona.'] } },
    });
    const out = serialize(apiErr);
    expect(typeof out.message).toBe('string');
    expect(out.message).not.toBe('[object Object]');
    expect(out.message).toContain('no está cubierto');
  });
});
