/**
 * Tests — Switch
 * Adaptado de @progress/kno-react-inputs (Switch) — referencia no runtime.
 * Verifica el patron WAI-ARIA switch: role=switch, aria-checked, toggle por
 * teclado/click, controlado vs no-controlado, disabled, y label a11y.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Switch from './Switch';

describe('Switch', () => {
  it('renderiza role=switch con aria-checked=false por defecto', () => {
    render(<Switch ariaLabel="Analytics" />);
    const sw = screen.getByRole('switch', { name: 'Analytics' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
  });

  it('respeta defaultChecked (no-controlado) y alterna al hacer click', () => {
    const onChange = jest.fn();
    render(<Switch ariaLabel="Analytics" defaultChecked onChange={onChange} />);
    const sw = screen.getByRole('switch');
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(sw).toHaveAttribute('aria-checked', 'false');
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('modo controlado: aria-checked sigue a la prop, no al estado interno', () => {
    const onChange = jest.fn();
    const { rerender } = render(<Switch ariaLabel="C" checked={false} onChange={onChange} />);
    const sw = screen.getByRole('switch');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    // sin re-render con checked=true, sigue false (controlado)
    expect(sw).toHaveAttribute('aria-checked', 'false');
    rerender(<Switch ariaLabel="C" checked onChange={onChange} />);
    expect(sw).toHaveAttribute('aria-checked', 'true');
  });

  it('disabled no alterna ni llama onChange', () => {
    const onChange = jest.fn();
    render(<Switch ariaLabel="D" disabled onChange={onChange} />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeDisabled();
    fireEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('enlaza el label visible con aria-labelledby', () => {
    render(<Switch label="Cookies analíticas" />);
    const sw = screen.getByRole('switch', { name: 'Cookies analíticas' });
    expect(sw).toHaveAttribute('aria-labelledby');
  });
});
