/**
 * errorSlice — normalizacion del message a string.
 *
 * handleAPIError/setContextError son el origen mas limpio para garantizar que
 * `globalError.message` y `contextErrors[x].message` sean SIEMPRE string, de
 * modo que ningun consumidor pinte "[object Object]".
 */
import errorReducer, {
  handleAPIError,
  setContextError,
} from './errorSlice';

const initial = () => errorReducer(undefined, { type: '@@INIT' });

describe('errorSlice — message siempre string', () => {
  it('handleAPIError normaliza un message objeto (dict DRF) a string', () => {
    const state = errorReducer(initial(), handleAPIError({
      message: { email: ['Ya existe una cuenta.'] },
      code: 'BAD_REQUEST',
      statusCode: 400,
    }));
    expect(typeof state.globalError.message).toBe('string');
    expect(state.globalError.message).not.toBe('[object Object]');
    expect(state.globalError.message).toContain('Ya existe una cuenta');
  });

  it('handleAPIError conserva un message string normal', () => {
    const state = errorReducer(initial(), handleAPIError({
      message: 'Falla simple',
      code: 'X',
      statusCode: 500,
    }));
    expect(state.globalError.message).toBe('Falla simple');
  });

  it('setContextError normaliza un message objeto a string', () => {
    const state = errorReducer(initial(), setContextError({
      context: 'checkout',
      error: { message: { total: ['Monto inválido'] } },
    }));
    expect(typeof state.contextErrors.checkout.message).toBe('string');
    expect(state.contextErrors.checkout.message).not.toBe('[object Object]');
    expect(state.contextErrors.checkout.message).toContain('Monto inválido');
  });
});
