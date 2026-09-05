/**
 * Tests — useScrollLock (Kaupamex UI)
 * Portado de template-ecommerce-ui.
 */
import { renderHook } from '@testing-library/react';
import useScrollLock from './useScrollLock';

describe('useScrollLock', () => {
  it('bloquea overflow del body cuando enabled=true', () => {
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
  });

  it('NO bloquea cuando enabled=false', () => {
    document.body.style.overflow = '';
    renderHook(() => useScrollLock(false));
    expect(document.body.style.overflow).toBe('');
  });

  it('restaura overflow original en cleanup', () => {
    document.body.style.overflow = 'auto';
    const { unmount } = renderHook(() => useScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});
