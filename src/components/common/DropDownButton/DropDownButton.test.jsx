/**
 * Tests — DropDownButton
 * Adaptado de @progress/kno-react-buttons (DropDownButton) — referencia no runtime.
 * Verifica: disparador con aria-haspopup=menu (sin acción por defecto),
 * apertura/cierre del menú, items onClick/href, cierre por Escape.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import DropDownButton from './DropDownButton';

describe('DropDownButton', () => {
  const items = [
    { text: 'Editar', href: '/admin/products/1/edit' },
    { text: 'Eliminar', onClick: jest.fn(), danger: true },
  ];

  it('el disparador anuncia un menú (aria-haspopup) y no hay menú hasta abrir', () => {
    render(<DropDownButton ariaLabel="Acciones" items={items} />);
    const trigger = screen.getByRole('button', { name: 'Acciones' });
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('abre el menú y muestra los items (href + onClick)', () => {
    render(<DropDownButton ariaLabel="Acciones" items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveAttribute('href', '/admin/products/1/edit');
    expect(screen.getByRole('menuitem', { name: 'Eliminar' })).toBeInTheDocument();
  });

  it('un item onClick se invoca y cierra el menú', () => {
    const onDelete = jest.fn();
    render(<DropDownButton ariaLabel="Acciones" items={[{ text: 'Eliminar', onClick: onDelete }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Eliminar' }));
    expect(onDelete).toHaveBeenCalled();
    expect(screen.queryByRole('menuitem', { name: 'Eliminar' })).not.toBeInTheDocument();
  });

  it('Escape cierra el menú', () => {
    render(<DropDownButton ariaLabel="Acciones" items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
