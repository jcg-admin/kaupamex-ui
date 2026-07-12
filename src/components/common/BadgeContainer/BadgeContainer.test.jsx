/**
 * Tests — BadgeContainer
 * Adaptado de @progress/kno-react-indicators (BadgeContainer) — referencia no runtime.
 * Verifica que envuelve su contenido y ancla un Badge en la esquina.
 */
import { render, screen } from '@testing-library/react';
import BadgeContainer from './BadgeContainer';
import Badge from '../Badge/Badge';

describe('BadgeContainer', () => {
  it('renderiza su contenido y el badge anclado', () => {
    render(
      <BadgeContainer>
        Notificaciones
        <Badge align={{ vertical: 'top', horizontal: 'end' }}>3</Badge>
      </BadgeContainer>,
    );
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
    const badge = screen.getByText('3');
    expect(badge).toHaveAttribute('data-position', 'corner');
  });

  it('respeta el className del consumidor', () => {
    render(<BadgeContainer className="probe">x</BadgeContainer>);
    expect(screen.getByText('x')).toHaveClass('probe');
  });
});
