/**
 * Tests — NumericTextBox
 * Adaptado de @progress/kno-react-inputs (NumericTextBox) — referencia no runtime.
 * Verifica input numerico nativo, reenvio del evento (e.target.value),
 * spinners con evento sintetico + clamp a [min,max], y disabled.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import NumericTextBox from './NumericTextBox';

describe('NumericTextBox', () => {
  it('renderiza un input numerico controlado', () => {
    render(<NumericTextBox ariaLabel="Precio" value={12} onChange={() => {}} />);
    const input = screen.getByLabelText('Precio');
    expect(input.type).toBe('number');
    expect(input).toHaveValue(12);
  });

  it('reenvía el evento nativo al teclear (e.target.value)', () => {
    // El input es controlado; se lee e.target.value de forma sincrona en el
    // handler (como haria el consumidor), no sobre el evento retenido — el DOM
    // vivo revierte al value controlado tras el re-render.
    let captured;
    const onChange = jest.fn((e) => { captured = e.target.value; });
    render(<NumericTextBox ariaLabel="Precio" value={1} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Precio'), { target: { value: '42' } });
    expect(onChange).toHaveBeenCalled();
    expect(captured).toBe('42');
  });

  it('el spinner ▲ emite un evento sintetico con el value incrementado', () => {
    const onChange = jest.fn();
    render(<NumericTextBox ariaLabel="Cantidad" value={5} step={1} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { hidden: true })[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: '6' }) }),
    );
  });

  it('el spinner respeta max (clamp)', () => {
    const onChange = jest.fn();
    render(<NumericTextBox ariaLabel="Cantidad" value={10} max={10} onChange={onChange} />);
    fireEvent.click(screen.getAllByRole('button', { hidden: true })[0]);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target: expect.objectContaining({ value: '10' }) }),
    );
  });

  it('disabled deshabilita input y spinners', () => {
    render(<NumericTextBox ariaLabel="Cantidad" value={1} disabled onChange={() => {}} />);
    expect(screen.getByLabelText('Cantidad')).toBeDisabled();
    screen.getAllByRole('button', { hidden: true }).forEach((b) => expect(b).toBeDisabled());
  });
});
