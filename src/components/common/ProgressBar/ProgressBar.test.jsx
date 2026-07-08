import { render, screen } from '@testing-library/react';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  it('determinado: expone role=progressbar con aria-valuenow', () => {
    render(<ProgressBar value={40} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '40');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).not.toHaveAttribute('aria-busy');
  });

  it('clampa el valor a 0-100', () => {
    render(<ProgressBar value={140} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('indeterminado (sin value): aria-busy, sin aria-valuenow', () => {
    render(<ProgressBar />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-busy', 'true');
    expect(bar).not.toHaveAttribute('aria-valuenow');
  });

  it('indeterminate=true fuerza el modo indeterminado', () => {
    render(<ProgressBar value={50} indeterminate />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-busy', 'true');
  });

  it('label={true} muestra el porcentaje en modo determinado', () => {
    render(<ProgressBar value={33} label />);
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('label como texto muestra el nodo', () => {
    render(<ProgressBar indeterminate label="Esperando…" />);
    expect(screen.getByText('Esperando…')).toBeInTheDocument();
  });
});
