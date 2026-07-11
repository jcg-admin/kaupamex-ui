/**
 * Tests — RadioGroup
 * Adaptado de @progress/kno-react-inputs (RadioGroup) — referencia no runtime.
 * Verifica role=radiogroup, selección por data, onChange con value,
 * controlado/no-controlado, name compartido y disabled.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import RadioGroup from './RadioGroup';

const DATA = [
  { label: 'Tarjeta', value: 'card' },
  { label: 'Efectivo', value: 'cash' },
  { label: 'Transferencia', value: 'wire' },
];

describe('RadioGroup', () => {
  it('renderiza role=radiogroup con un radio por item', () => {
    render(<RadioGroup ariaLabel="Método" data={DATA} />);
    expect(screen.getByRole('radiogroup', { name: 'Método' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('marca el defaultValue (no-controlado) y reenvía el evento nativo', () => {
    const onChange = jest.fn();
    render(<RadioGroup ariaLabel="M" data={DATA} defaultValue="card" onChange={onChange} />);
    expect(screen.getByLabelText('Tarjeta')).toBeChecked();
    fireEvent.click(screen.getByLabelText('Efectivo'));
    // onChange recibe el evento nativo del <input>, no un value pelón:
    // el consumidor usa e.target.value sin cambiar su handler.
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: 'cash' }) }),
    );
    expect(screen.getByLabelText('Efectivo')).toBeChecked();
  });

  it('modo controlado: la selección sigue a la prop value', () => {
    const { rerender } = render(<RadioGroup ariaLabel="M" data={DATA} value="card" onChange={() => {}} />);
    expect(screen.getByLabelText('Tarjeta')).toBeChecked();
    rerender(<RadioGroup ariaLabel="M" data={DATA} value="wire" onChange={() => {}} />);
    expect(screen.getByLabelText('Transferencia')).toBeChecked();
  });

  it('comparte el mismo name entre los radios', () => {
    render(<RadioGroup ariaLabel="M" data={DATA} name="pay" />);
    screen.getAllByRole('radio').forEach((r) => expect(r).toHaveAttribute('name', 'pay'));
  });

  it('disabled desactiva todos y no emite onChange', () => {
    const onChange = jest.fn();
    render(<RadioGroup ariaLabel="M" data={DATA} disabled onChange={onChange} />);
    const radios = screen.getAllByRole('radio');
    radios.forEach((r) => expect(r).toBeDisabled());
    fireEvent.click(radios[1]);
    expect(onChange).not.toHaveBeenCalled();
  });
});
