/**
 * ToastContainer — endurecimiento defensivo del render.
 *
 * Aunque el origen (GlobalErrorNotifier / errorSlice) normalice el mensaje, el
 * contenedor no debe pintar "[object Object]" si `message`/`title` llega como
 * objeto por cualquier ruta.
 */
import { render, screen, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import uiReducer, { addToast } from '@redux/slices/uiSlice';
import ToastContainer from './ToastContainer';

function renderWithToast(toast) {
  const store = configureStore({ reducer: { ui: uiReducer } });
  store.dispatch(addToast(toast));
  render(
    <Provider store={store}>
      <ToastContainer />
    </Provider>,
  );
  return store;
}

describe('ToastContainer — coercion defensiva', () => {
  it('no renderiza "[object Object]" si message es un objeto', () => {
    renderWithToast({
      type: 'error',
      title: 'Algo salió mal',
      message: { email: ['Ya existe una cuenta.'] },
    });
    expect(screen.queryByText('[object Object]')).toBeNull();
    // Aparece un texto legible derivado del objeto.
    expect(screen.getByText(/Ya existe una cuenta/)).toBeInTheDocument();
  });

  it('no renderiza "[object Object]" si title es un objeto', () => {
    renderWithToast({
      type: 'error',
      title: { foo: 'bar' },
      message: 'ok',
    });
    expect(screen.queryByText('[object Object]')).toBeNull();
  });

  it('renderiza un message string normal sin cambios', () => {
    renderWithToast({ type: 'info', message: 'Todo bien' });
    expect(screen.getByText('Todo bien')).toBeInTheDocument();
  });
});

describe('ToastContainer — auto-descarte (H-10)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('descarta un toast despachado directo tras 4s (default)', () => {
    // AddToWishlistButton despacha addToast directo (sin ToastContext). Antes
    // este toast se quedaba fijo porque nadie programaba su remocion.
    renderWithToast({ type: 'success', message: 'Se agregó a tu lista de deseos.' });
    expect(screen.getByText(/Se agregó a tu lista/)).toBeInTheDocument();
    act(() => { jest.advanceTimersByTime(4000); });
    expect(screen.queryByText(/Se agregó a tu lista/)).toBeNull();
  });

  it('respeta duration=0 (toast fijo, no se auto-descarta)', () => {
    renderWithToast({ type: 'info', message: 'Persistente', duration: 0 });
    act(() => { jest.advanceTimersByTime(60000); });
    expect(screen.getByText('Persistente')).toBeInTheDocument();
  });
});
