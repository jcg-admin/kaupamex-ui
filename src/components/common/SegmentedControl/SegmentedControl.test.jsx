/**
 * Tests — SegmentedControl
 * Adaptado de @progress/kno-react-buttons (SegmentedControl) — referencia no runtime.
 * Verifica grupo de seleccion unica: aria-pressed, onChange(value),
 * controlado/no-controlado, disabled.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import SegmentedControl from './SegmentedControl';

const DATA = [
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'all', label: 'Todos' },
];

describe('SegmentedControl', () => {
  it('marca el seleccionado con aria-pressed', () => {
    render(<SegmentedControl ariaLabel="Estado" data={DATA} value="active" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Activos' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('emite onChange con el value al elegir un segmento', () => {
    const onChange = jest.fn();
    render(<SegmentedControl ariaLabel="Estado" data={DATA} value="active" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Inactivos' }));
    expect(onChange).toHaveBeenCalledWith('inactive');
  });

  it('modo no-controlado: usa defaultValue y actualiza la selección', () => {
    render(<SegmentedControl ariaLabel="E" data={DATA} defaultValue="all" />);
    expect(screen.getByRole('button', { name: 'Todos' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'Activos' }));
    expect(screen.getByRole('button', { name: 'Activos' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('disabled no emite onChange', () => {
    const onChange = jest.fn();
    render(<SegmentedControl ariaLabel="E" data={DATA} value="active" disabled onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Inactivos' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
