/**
 * Icon — SVG inline con fill=currentColor (paths de la referencia Kendo).
 */
import { render } from '@testing-library/react';
import Icon from './Icon';

describe('Icon', () => {
  it('renderiza un <svg> 24x24 con fill=currentColor para un nombre conocido', () => {
    const { container } = render(<Icon name="menu" size={22} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('width', '22');
    expect(svg).toHaveAttribute('fill', 'currentColor');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg.querySelector('path')).toHaveAttribute('d');
  });

  it('con title expone role=img y elimina aria-hidden', () => {
    const { container } = render(<Icon name="star" title="destacado" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).not.toHaveAttribute('aria-hidden');
    expect(svg.querySelector('title')).toHaveTextContent('destacado');
  });

  it('devuelve null para un nombre desconocido', () => {
    const { container } = render(<Icon name="no-existe" />);
    expect(container.querySelector('svg')).toBeNull();
  });
});
