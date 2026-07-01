/**
 * GlobalErrorNotifier — pruebas de coercion defensiva del mensaje.
 *
 * Regresion (/checkout): un globalError cuyo `message` es un objeto (dict de
 * validacion DRF) provocaba un toast con el literal "[object Object]".
 */
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import errorReducer, { handleAPIError } from '@redux/slices/errorSlice';
import uiReducer from '@redux/slices/uiSlice';
import GlobalErrorNotifier from './GlobalErrorNotifier';

function makeStore() {
  return configureStore({
    reducer: { error: errorReducer, ui: uiReducer },
  });
}

describe('GlobalErrorNotifier — coercion del mensaje del toast', () => {
  it('no emite un toast con "[object Object]" cuando message es un objeto', () => {
    const store = makeStore();
    // Un error con statusCode 400 (no 401/5xx/network) cuyo message es un
    // dict de validacion DRF, tal como podria llegar en /checkout.
    store.dispatch(handleAPIError({
      message: { email: ['Ya existe una cuenta con este correo.'] },
      code: 'BAD_REQUEST',
      statusCode: 400,
    }));

    render(
      <Provider store={store}>
        <GlobalErrorNotifier />
      </Provider>,
    );

    const toasts = store.getState().ui.toasts;
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).not.toBe('[object Object]');
    expect(typeof toasts[0].message).toBe('string');
    expect(toasts[0].message).toContain('Ya existe una cuenta');
  });

  it('nunca pasa un objeto crudo como message del toast', () => {
    const store = makeStore();
    store.dispatch(handleAPIError({
      message: { detail: 'Algo falló', extra: { nested: true } },
      code: 'UNKNOWN',
      statusCode: 400,
    }));

    render(
      <Provider store={store}>
        <GlobalErrorNotifier />
      </Provider>,
    );

    const toasts = store.getState().ui.toasts;
    expect(toasts).toHaveLength(1);
    expect(typeof toasts[0].message).toBe('string');
    expect(toasts[0].message).not.toBe('[object Object]');
  });

  it('sigue mostrando el mensaje string normal', () => {
    const store = makeStore();
    store.dispatch(handleAPIError({
      message: 'Mensaje simple',
      code: 'UNKNOWN',
      statusCode: 400,
    }));

    render(
      <Provider store={store}>
        <GlobalErrorNotifier />
      </Provider>,
    );

    const toasts = store.getState().ui.toasts;
    expect(toasts[0].message).toBe('Mensaje simple');
  });
});
