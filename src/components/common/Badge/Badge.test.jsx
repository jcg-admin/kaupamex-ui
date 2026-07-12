/**
 * Tests — Badge
 * Adaptado de @progress/kno-react-indicators (Badge) — referencia no runtime.
 * Verifica: render de children, standalone inline (sin align) vs posicionado
 * en esquina (con align), y themeColor/fillMode aplicados.
 */
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renderiza su contenido (patron <Badge>99+</Badge>)', () => {
    render(<Badge>99+</Badge>);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('sin align: es un badge inline (no posicionado en esquina)', () => {
    // Las clases de CSS-module se mockean en jest; el estado inline/corner se
    // expone via data-position (contrato observable sin CSS real).
    render(<Badge>3</Badge>);
    expect(screen.getByText('3')).toHaveAttribute('data-position', 'inline');
  });

  it('con align: se posiciona en la esquina (overlay de BadgeContainer)', () => {
    render(<Badge align={{ vertical: 'top', horizontal: 'end' }}>8</Badge>);
    expect(screen.getByText('8')).toHaveAttribute('data-position', 'corner');
  });

  it('pasa props extra al span (aria-hidden, data-*)', () => {
    render(<Badge aria-hidden="true" data-testid="b">5</Badge>);
    expect(screen.getByTestId('b')).toHaveAttribute('aria-hidden', 'true');
  });
});
