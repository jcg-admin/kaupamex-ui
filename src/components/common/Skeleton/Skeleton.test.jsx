import { render } from '@testing-library/react';
import Skeleton from './Skeleton';

describe('Skeleton', () => {
  it('renderiza una línea por defecto (variant text)', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(1);
  });

  it('repite count líneas en variant text', () => {
    const { container } = render(<Skeleton count={3} />);
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(3);
  });

  it('count no aplica fuera de variant text (rect = 1)', () => {
    const { container } = render(<Skeleton variant="rect" count={4} />);
    expect(container.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(1);
  });

  it('aplica width/height numéricos como px', () => {
    const { container } = render(<Skeleton variant="rect" width={120} height={40} />);
    const el = container.querySelector('span');
    expect(el).toHaveStyle({ width: '120px', height: '40px' });
  });

  it('es decorativo (aria-hidden)', () => {
    const { container } = render(<Skeleton />);
    expect(container.querySelector('span')).toHaveAttribute('aria-hidden', 'true');
  });
});
