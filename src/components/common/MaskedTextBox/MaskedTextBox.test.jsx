/**
 * Tests — MaskedTextBox
 * Adaptado de @progress/kno-react-inputs (MaskedTextBox) — referencia no runtime.
 * Verifica el enmascarado por tokens y el reenvio del evento con la misma forma
 * nativa (target.value ya enmascarado).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import MaskedTextBox, { applyMask } from './MaskedTextBox';

describe('applyMask', () => {
  it('enmascara digitos con literales (9-000)', () => {
    expect(applyMask('1234', '9-000')).toBe('1-234');
  });
  it('descarta caracteres que no cumplen el token', () => {
    expect(applyMask('12ab34', '0000')).toBe('1234');
  });
  it('limita a la longitud de la mascara (CP 5)', () => {
    expect(applyMask('1234567', '00000')).toBe('12345');
  });
});

describe('MaskedTextBox', () => {
  it('reenvía el evento con el value enmascarado (e.target.value)', () => {
    let captured;
    const onChange = jest.fn((e) => { captured = e.target.value; });
    render(<MaskedTextBox ariaLabel="Teléfono" mask="0000000000" value="" onChange={onChange} />);
    // Entra con letras y de más; sólo sobreviven 10 dígitos, en orden.
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '55-1234-5678x9' } });
    expect(onChange).toHaveBeenCalled();
    expect(captured).toBe('5512345678');
  });

  it('aria-invalid con error', () => {
    render(<MaskedTextBox ariaLabel="CP" mask="00000" value="" error="obligatorio" onChange={() => {}} />);
    expect(screen.getByLabelText('CP')).toHaveAttribute('aria-invalid', 'true');
  });
});
