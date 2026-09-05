/**
 * Tests — useClickOutside (Kaupamex UI)
 * Portado de template-ecommerce-ui.
 */
import { renderHook, act } from '@testing-library/react';
import { useRef } from 'react';
import useClickOutside from './useClickOutside';

describe('useClickOutside', () => {
  it('llama handler cuando el click es fuera del ref', () => {
    const handler = jest.fn();
    renderHook(() => {
      const ref = useRef(document.createElement('div'));
      useClickOutside(ref, handler);
      return ref;
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('NO llama handler cuando el click es dentro del ref', () => {
    const handler = jest.fn();
    let innerEl;

    renderHook(() => {
      const ref = useRef(document.createElement('div'));
      innerEl = document.createElement('button');
      ref.current.appendChild(innerEl);
      document.body.appendChild(ref.current);
      useClickOutside(ref, handler);
      return ref;
    });

    act(() => {
      innerEl.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('NO llama handler cuando enabled=false', () => {
    const handler = jest.fn();
    renderHook(() => {
      const ref = useRef(document.createElement('div'));
      useClickOutside(ref, handler, false);
      return ref;
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('limpia el listener en unmount', () => {
    const removeSpy = jest.spyOn(document, 'removeEventListener');
    const handler = jest.fn();

    const { unmount } = renderHook(() => {
      const ref = useRef(document.createElement('div'));
      useClickOutside(ref, handler);
      return ref;
    });

    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    removeSpy.mockRestore();
  });
});
