/**
 * Tests — Avatar
 * Adaptado de @progress/kno-react-layout (Avatar) — referencia no runtime.
 * Verifica el patrón src ? <img> : iniciales/icono y el respeto del className
 * del consumidor (preserva el look de los sitios existentes).
 */
import { render, screen } from '@testing-library/react';
import Avatar from './Avatar';

describe('Avatar', () => {
  it('con src renderiza una imagen', () => {
    render(<Avatar src="/u.jpg" alt="Foto" />);
    const img = screen.getByRole('img', { name: 'Foto' });
    expect(img).toHaveAttribute('src', '/u.jpg');
  });

  it('sin src cae a las iniciales', () => {
    render(<Avatar initials="JS" />);
    expect(screen.getByText('JS')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('respeta el className del consumidor (look del sitio existente)', () => {
    render(<Avatar initials="AB" className="probe" />);
    // Las iniciales son un nodo de texto directo; getByText devuelve el propio
    // contenedor del avatar, que debe conservar la clase del consumidor.
    expect(screen.getByText('AB')).toHaveClass('probe');
  });

  it('children tiene prioridad (type=icon/custom)', () => {
    render(<Avatar src="/u.jpg"><span data-testid="ic">icon</span></Avatar>);
    expect(screen.getByTestId('ic')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
