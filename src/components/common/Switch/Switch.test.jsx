/**
 * Tests — Switch
 * Adaptado de @progress/kno-react-inputs (Switch) — referencia no runtime.
 * Es un <input type="checkbox" role="switch"> nativo: onChange reenvia el
 * evento (e.target.checked), controlado/no-controlado por checked/defaultChecked,
 * disabled, y label enlazado.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Switch from './Switch';

describe('Switch', () => {
  it('renderiza role=switch, sin marcar por defecto', () => {
    render(<Switch ariaLabel="Analytics" />);
    const sw = screen.getByRole('switch', { name: 'Analytics' });
    expect(sw).not.toBeChecked();
  });

  it('respeta defaultChecked y reenvía el evento nativo al alternar', () => {
    let captured;
    const onChange = jest.fn((e) => { captured = e.target.checked; });
    render(<Switch ariaLabel="Analytics" defaultChecked onChange={onChange} />);
    const sw = screen.getByRole('switch');
    expect(sw).toBeChecked();
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalled();
    expect(captured).toBe(false);
  });

  it('modo controlado: checked sigue a la prop', () => {
    const { rerender } = render(<Switch ariaLabel="C" checked={false} onChange={() => {}} />);
    expect(screen.getByRole('switch')).not.toBeChecked();
    rerender(<Switch ariaLabel="C" checked onChange={() => {}} />);
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('disabled deshabilita el control', () => {
    render(<Switch ariaLabel="D" disabled />);
    expect(screen.getByRole('switch')).toBeDisabled();
  });

  it('enlaza el label visible con el control', () => {
    render(<Switch label="Cookies analíticas" />);
    expect(screen.getByRole('switch', { name: 'Cookies analíticas' })).toBeInTheDocument();
  });
});
