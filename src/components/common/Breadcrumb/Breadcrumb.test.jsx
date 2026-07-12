/**
 * Tests — Breadcrumb
 * Adaptado de @progress/kno-react-layout (Breadcrumb) — referencia no runtime.
 * Verifica: items intermedios enlazan, el ultimo es el actual (sin enlace,
 * aria-current), separadores entre items, y el respeto del className del
 * consumidor (preserva el look de los sitios existentes).
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from './Breadcrumb';

const renderBc = (props) =>
  render(
    <MemoryRouter>
      <Breadcrumb {...props} />
    </MemoryRouter>,
  );

describe('Breadcrumb', () => {
  const items = [
    { label: 'Mi cuenta', to: '/account' },
    { label: 'Mis pedidos', to: '/account/orders' },
    { label: 'ORD-123' },
  ];

  it('enlaza los items intermedios', () => {
    renderBc({ items });
    expect(screen.getByRole('link', { name: 'Mi cuenta' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('link', { name: 'Mis pedidos' })).toHaveAttribute('href', '/account/orders');
  });

  it('el ultimo item es el actual, sin enlace y con aria-current', () => {
    renderBc({ items, currentClassName: 'current' });
    expect(screen.queryByRole('link', { name: 'ORD-123' })).not.toBeInTheDocument();
    const current = screen.getByText('ORD-123');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveClass('current');
  });

  it('inserta un separador entre items pero no tras el ultimo', () => {
    renderBc({ items, separator: '/' });
    // 2 separadores para 3 items.
    const seps = screen.getAllByText('/');
    expect(seps).toHaveLength(2);
  });

  it('respeta el className del consumidor en el nav', () => {
    renderBc({ items, className: 'probe' });
    expect(screen.getByRole('navigation')).toHaveClass('probe');
  });

  it('soporta href crudo para items no-SPA', () => {
    renderBc({ items: [{ label: 'Inicio', href: '/' }, { label: 'Catálogo' }] });
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/');
  });
});
