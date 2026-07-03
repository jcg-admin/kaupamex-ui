/**
 * Card primitive (H-10) — header (título/subtítulo/acciones), body y footer.
 */
import { render, screen } from '@testing-library/react';
import { Card } from './index';

describe('Card (H-10)', () => {
  it('renderiza título, subtítulo, cuerpo y footer', () => {
    render(
      <Card title="Zonas" subtitle="catálogo" footer={<button>Guardar</button>}>
        <p>contenido</p>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Zonas' })).toBeInTheDocument();
    expect(screen.getByText('catálogo')).toBeInTheDocument();
    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('sin título ni acciones no renderiza header', () => {
    const { container } = render(<Card>solo cuerpo</Card>);
    expect(screen.getByText('solo cuerpo')).toBeInTheDocument();
    expect(container.querySelector('header')).toBeNull();
  });

  it('renderiza acciones en el header', () => {
    render(<Card title="X" actions={<button>Nuevo</button>}>y</Card>);
    expect(screen.getByRole('button', { name: 'Nuevo' })).toBeInTheDocument();
  });
});
