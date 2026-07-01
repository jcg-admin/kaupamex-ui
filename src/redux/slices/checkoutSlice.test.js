/**
 * Tests — checkoutSlice: estados de carga/error de métodos de envío.
 *
 * Regresión: fetchShippingMethods sólo tenía handler .fulfilled; si el
 * endpoint fallaba, shippingOptions nunca se llenaba y la UI quedaba
 * colgada en "Cargando métodos de envío…" sin señal de error.
 */
import reducer, { fetchShippingMethods } from './checkoutSlice';

describe('checkoutSlice — métodos de envío', () => {
  it('pending marca shippingLoading y limpia el error', () => {
    const state = reducer(undefined, { type: fetchShippingMethods.pending.type });
    expect(state.shippingLoading).toBe(true);
    expect(state.shippingError).toBe(null);
  });

  it('fulfilled guarda las opciones y apaga la carga', () => {
    const opts = [{ id: 1, name: 'Estándar', cost: '99.00', estimated_days: 3 }];
    const state = reducer(undefined, {
      type: fetchShippingMethods.fulfilled.type,
      payload: opts,
    });
    expect(state.shippingOptions).toEqual(opts);
    expect(state.shippingLoading).toBe(false);
    expect(state.shippingError).toBe(null);
  });

  it('rejected apaga la carga y expone el error', () => {
    const err = { message: 'No se pudieron cargar los métodos de envío.' };
    const state = reducer(undefined, {
      type: fetchShippingMethods.rejected.type,
      payload: err,
    });
    expect(state.shippingLoading).toBe(false);
    expect(state.shippingError).toEqual(err);
  });
});
