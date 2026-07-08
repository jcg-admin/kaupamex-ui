import { render, screen } from '@testing-library/react';
import CheckoutSteps from './CheckoutSteps';

describe('CheckoutSteps', () => {
  it('renderiza los 5 pasos del mockup', () => {
    render(<CheckoutSteps current={1} />);
    ['Bolsa', 'Contacto', 'Envío', 'Pago', 'Revisar'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('marca el paso actual con aria-current="step"', () => {
    render(<CheckoutSteps current={4} />);
    const active = screen.getByText('Pago').closest('li');
    expect(active).toHaveAttribute('aria-current', 'step');
  });

  it('expone el progreso en el aria-label de la lista', () => {
    render(<CheckoutSteps current={4} />);
    expect(screen.getByRole('list', { name: /Paso 4 de 5/i })).toBeInTheDocument();
  });

  it('los pasos previos al actual muestran el check (✓), no el número', () => {
    render(<CheckoutSteps current={4} />);
    // Bolsa/Contacto/Envío (01-03) están completados → ✓, no "01".
    expect(screen.queryByText('01')).not.toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument(); // el activo conserva su número
  });
});
