/**
 * Tests — SplitButton
 * Adaptado de @progress/kno-react-buttons (SplitButton) — referencia no runtime.
 * Verifica accion primaria, apertura de menu (aria-expanded), items onClick/href,
 * cierre por Escape, y disabled.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import SplitButton from './SplitButton';

describe('SplitButton', () => {
  const items = [
    { text: 'Exportar PDF', onClick: jest.fn() },
    { text: 'Exportar CSV', href: '/reporte.csv' },
  ];

  it('la acción primaria dispara onClick', () => {
    const onClick = jest.fn();
    render(<SplitButton text="Exportar" onClick={onClick} items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('abre el menu y muestra los items (onClick + href)', () => {
    render(<SplitButton text="Exportar" onClick={() => {}} items={items} />);
    const toggle = screen.getByRole('button', { name: 'Más acciones' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menuitem', { name: 'Exportar PDF' })).toBeInTheDocument();
    const link = screen.getByRole('menuitem', { name: 'Exportar CSV' });
    expect(link).toHaveAttribute('href', '/reporte.csv');
  });

  it('un item onClick se invoca y cierra el menu', () => {
    const onItem = jest.fn();
    render(<SplitButton text="Exportar" onClick={() => {}} items={[{ text: 'PDF', onClick: onItem }]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'PDF' }));
    expect(onItem).toHaveBeenCalled();
    expect(screen.queryByRole('menuitem', { name: 'PDF' })).not.toBeInTheDocument();
  });

  it('Escape cierra el menu', () => {
    render(<SplitButton text="Exportar" onClick={() => {}} items={items} />);
    fireEvent.click(screen.getByRole('button', { name: 'Más acciones' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('disabled bloquea la acción y el toggle', () => {
    const onClick = jest.fn();
    render(<SplitButton text="Exportar" onClick={onClick} items={items} disabled />);
    expect(screen.getByRole('button', { name: 'Exportar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Más acciones' })).toBeDisabled();
  });
});
