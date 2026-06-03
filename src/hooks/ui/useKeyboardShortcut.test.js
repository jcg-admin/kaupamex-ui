/**
 * Tests — useKeyboardShortcut (PracticaYoruba UI)
 * Portado de template-ecommerce-ui.
 */
import { renderHook, act } from '@testing-library/react';
import useKeyboardShortcut from './useKeyboardShortcut';

const fire = (key, opts = {}) =>
  document.dispatchEvent(
    new KeyboardEvent('keydown', { key, bubbles: true, ...opts }),
  );

describe('useKeyboardShortcut', () => {
  it('llama handler con Ctrl+K', () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', ctrl: true }, handler));
    act(() => fire('k', { ctrlKey: true }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('NO llama con K sola', () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', ctrl: true }, handler));
    act(() => fire('k'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('NO llama con Ctrl+J', () => {
    const handler = jest.fn();
    renderHook(() => useKeyboardShortcut({ key: 'k', ctrl: true }, handler));
    act(() => fire('j', { ctrlKey: true }));
    expect(handler).not.toHaveBeenCalled();
  });

  it('NO llama cuando enabled=false', () => {
    const handler = jest.fn();
    renderHook(() =>
      useKeyboardShortcut({ key: 'k', ctrl: true }, handler, false),
    );
    act(() => fire('k', { ctrlKey: true }));
    expect(handler).not.toHaveBeenCalled();
  });
});
