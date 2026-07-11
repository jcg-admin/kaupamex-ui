/**
 * Tests — Checkbox
 * Adaptado de @progress/kno-react-inputs (Checkbox) — referencia no runtime.
 * Verifica semantica nativa: role=checkbox, label enlazado, onChange booleano,
 * disabled, indeterminate, y aria-invalid con error.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Checkbox from './Checkbox';

describe('Checkbox', () => {
  it('renderiza un checkbox nativo con label enlazado', () => {
    render(<Checkbox label="Acepto términos" />);
    const cb = screen.getByRole('checkbox', { name: 'Acepto términos' });
    expect(cb).toBeInTheDocument();
    expect(cb.type).toBe('checkbox');
  });

  it('reenvía el evento nativo al alternar (e.target.checked)', () => {
    const onChange = jest.fn();
    render(<Checkbox ariaLabel="c" onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ checked: true }) }),
    );
  });

  it('respeta checked controlado', () => {
    render(<Checkbox ariaLabel="c" checked readOnly />);
    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('disabled no dispara onChange', () => {
    const onChange = jest.fn();
    render(<Checkbox ariaLabel="c" disabled onChange={onChange} />);
    const cb = screen.getByRole('checkbox');
    expect(cb).toBeDisabled();
    fireEvent.click(cb);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('refleja indeterminate en el DOM', () => {
    render(<Checkbox ariaLabel="c" indeterminate />);
    expect(screen.getByRole('checkbox').indeterminate).toBe(true);
  });

  it('pone aria-invalid con error', () => {
    render(<Checkbox ariaLabel="c" error="obligatorio" />);
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  });
});
