/**
 * Field primitive — modo textarea (auto-resize + contador).
 * Cubre la extension de Fase 10 (portada de kno-react-inputs/textarea) sin
 * romper el modo input clasico.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Field } from './index';

function ControlledField({ initial = '', ...props }) {
  const [value, setValue] = useState(initial);
  return <Field {...props} value={value} onChange={(e) => setValue(e.target.value)} />;
}

describe('Field (textarea)', () => {
  it('renderiza un textarea cuando textarea=true', () => {
    render(<Field label="Notas" name="notas" textarea value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });

  it('muestra el contador n/max cuando hay maxLength', async () => {
    render(<ControlledField label="Comentario" name="c" textarea maxLength={100} initial="hola" />);
    expect(screen.getByText('4/100')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox'), '!');
    expect(screen.getByText('5/100')).toBeInTheDocument();
  });

  it('propaga maxLength al textarea (limita la entrada)', async () => {
    render(<ControlledField label="Corto" name="s" textarea maxLength={3} />);
    const ta = screen.getByRole('textbox');
    await userEvent.type(ta, 'abcdef');
    expect(ta.value).toBe('abc');
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('sin maxLength no muestra contador salvo showCount', () => {
    const { rerender } = render(<Field label="X" name="x" textarea value="hey" onChange={() => {}} />);
    expect(screen.queryByText('3')).not.toBeInTheDocument();
    rerender(<Field label="X" name="x" textarea showCount value="hey" onChange={() => {}} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('modo input clasico sigue siendo un <input> sin contador', () => {
    render(<Field label="Email" name="email" value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox').tagName).toBe('INPUT');
  });

  it('autoResize no rompe el render (ajuste de altura best-effort)', () => {
    render(<Field label="Auto" name="a" textarea autoResize value="linea" onChange={() => {}} />);
    expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
  });
});
