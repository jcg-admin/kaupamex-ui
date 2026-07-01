/**
 * ToastContainer — endurecimiento defensivo del render.
 *
 * Aunque el origen (GlobalErrorNotifier / errorSlice) normalice el mensaje, el
 * contenedor no debe pintar "[object Object]" si `message`/`title` llega como
 * objeto por cualquier ruta.
 */
import { render, screen } from '@testing-library/react';
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
