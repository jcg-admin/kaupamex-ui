/**
 * Tests — Loader
 * Adaptado de @progress/kno-react-indicators (Loader) — referencia no runtime.
 * Verifica role=status, aria-label por defecto/custom, y el tipo (data-type).
 */
import { render, screen } from '@testing-library/react';
import Loader from './Loader';

describe('Loader', () => {
  it('es un indicador role=status con aria-label por defecto', () => {
    render(<Loader />);
    const el = screen.getByRole('status');
    expect(el).toHaveAttribute('aria-label', 'Cargando');
    expect(el).toHaveAttribute('data-type', 'infinite-spinner');
  });

  it('respeta ariaLabel custom', () => {
    render(<Loader ariaLabel="Procesando pago" />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Procesando pago');
  });

  it('type=pulsing renderiza el indicador de puntos', () => {
    render(<Loader type="pulsing" />);
    expect(screen.getByRole('status')).toHaveAttribute('data-type', 'pulsing');
  });

  it('pasa props extra (data-*, className)', () => {
    render(<Loader data-testid="l" className="probe" />);
    expect(screen.getByTestId('l')).toHaveClass('probe');
  });
});
