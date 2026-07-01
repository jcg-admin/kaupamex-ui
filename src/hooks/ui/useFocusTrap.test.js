/**
 * useFocusTrap — pruebas del focus trap para overlays no-<dialog>.
 */
import { render, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import useFocusTrap from './useFocusTrap';

function Trap({ enabled = true }) {
  const ref = useRef(null);
  useFocusTrap(ref, enabled);
  return (
    <div>
      <button type="button" data-testid="outside">outside</button>
      <div ref={ref} role="dialog">
        <button type="button" data-testid="first">first</button>
        <button type="button" data-testid="mid">mid</button>
        <button type="button" data-testid="last">last</button>
      </div>
    </div>
  );
}

describe('useFocusTrap', () => {
  it('Tab desde el ultimo vuelve al primero', () => {
    const { getByTestId } = render(<Trap />);
    const last = getByTestId('last');
    const first = getByTestId('first');
    last.focus();
    expect(document.activeElement).toBe(last);
    fireEvent.keyDown(getByTestId('last').closest('[role="dialog"]'), { key: 'Tab' });
    expect(document.activeElement).toBe(first);
  });

  it('Shift+Tab desde el primero salta al ultimo', () => {
    const { getByTestId } = render(<Trap />);
    const first = getByTestId('first');
    const last = getByTestId('last');
    first.focus();
    fireEvent.keyDown(first.closest('[role="dialog"]'), { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  it('teclas que no son Tab no alteran el foco', () => {
    const { getByTestId } = render(<Trap />);
    const mid = getByTestId('mid');
    mid.focus();
    fireEvent.keyDown(mid.closest('[role="dialog"]'), { key: 'a' });
    expect(document.activeElement).toBe(mid);
  });

  it('deshabilitado no atrapa el foco', () => {
    const { getByTestId } = render(<Trap enabled={false} />);
    const last = getByTestId('last');
    last.focus();
    fireEvent.keyDown(last.closest('[role="dialog"]'), { key: 'Tab' });
    // sin trap el foco no se fuerza al primero
    expect(document.activeElement).toBe(last);
  });
});
