/**
 * Tests — useFloating (Kaupamex UI)
 *
 * Adaptado de template-ecommerce-ui. El template usa @floating-ui/react;
 * esta version es nativa (getBoundingClientRect) y expone el mismo
 * contrato publico (refs, floatingStyles, placement).
 */
import { renderHook, act } from '@testing-library/react';
import useFloating from './useFloating';

describe('useFloating', () => {
  it('retorna refs y floatingStyles', () => {
    const { result } = renderHook(() => useFloating());
    expect(result.current.refs).toBeDefined();
    expect(result.current.refs.setReference).toBeInstanceOf(Function);
    expect(result.current.refs.setFloating).toBeInstanceOf(Function);
    expect(result.current.floatingStyles).toBeDefined();
    expect(result.current.floatingStyles.position).toBe('absolute');
  });

  it('usa el placement por defecto bottom-start', () => {
    const { result } = renderHook(() => useFloating());
    expect(result.current.placement).toBe('bottom-start');
  });

  it('acepta placement personalizado', () => {
    const { result } = renderHook(() => useFloating({ placement: 'top' }));
    expect(result.current.placement).toBe('top');
  });

  it('funciona con enabled=false (sin listeners de scroll/resize)', () => {
    const { result } = renderHook(() => useFloating({ enabled: false }));
    expect(result.current.refs).toBeDefined();
    expect(result.current.floatingStyles).toBeDefined();
  });

  it('calcula posicion cuando setReference recibe un nodo', () => {
    const { result } = renderHook(() => useFloating({ offsetPx: 4 }));
    const node = document.createElement('button');
    node.getBoundingClientRect = () => ({
      top: 100,
      bottom: 120,
      left: 50,
      right: 80,
      width: 30,
      height: 20,
    });
    act(() => {
      result.current.refs.setReference(node);
    });
    // bottom (120) + offset (4) = 124px top; left = 50px.
    expect(result.current.floatingStyles.top).toBe('124px');
    expect(result.current.floatingStyles.left).toBe('50px');
  });
});
