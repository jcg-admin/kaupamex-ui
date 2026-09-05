/**
 * Tests — useEscapeKey (Kaupamex UI)
 * Portado de template-ecommerce-ui.
 */
import { renderHook, act } from '@testing-library/react';
import useEscapeKey from './useEscapeKey';

describe('useEscapeKey', () => {
  it('llama handler al presionar Escape', () => {
    const handler = jest.fn();
    renderHook(() => useEscapeKey(handler));
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('NO llama handler con otras teclas', () => {
    const handler = jest.fn();
    renderHook(() => useEscapeKey(handler));
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
      );
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('NO llama handler cuando enabled=false', () => {
    const handler = jest.fn();
    renderHook(() => useEscapeKey(handler, false));
    act(() => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('limpia listener en unmount', () => {
    const spy = jest.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useEscapeKey(jest.fn()));
    unmount();
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function));
    spy.mockRestore();
  });
});
