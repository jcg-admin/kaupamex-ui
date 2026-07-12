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

  it('renderItem pinta contenido por segmento (badge de conteo)', () => {
    const withCounts = [
      { value: 'active', label: 'Activos', count: 16 },
      { value: 'all', label: 'Todos', count: 48 },
    ];
    render(
      <SegmentedControl
        ariaLabel="Estado"
        data={withCounts}
        value="active"
        onChange={() => {}}
        renderItem={(opt) => (
          <>
            {opt.label} <span data-testid={`count-${opt.value}`}>({opt.count})</span>
          </>
        )}
      />,
    );
    // El segmento incluye label + badge; el nombre accesible los concatena.
    expect(screen.getByRole('button', { name: /Activos \(16\)/ })).toBeInTheDocument();
    expect(screen.getByTestId('count-all')).toHaveTextContent('(48)');
  });
});
