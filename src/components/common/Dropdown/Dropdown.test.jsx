/**
 * Tests: Dropdown — API completa de ui-core dropdown.js
 * Opciones: autoClose, offset, display, reference
 * Métodos: toggle, show, hide, dispose, update
 */
import { render, screen, fireEvent, act } from '@testing-library/react';
import { createRef } from 'react';
import Dropdown, { DropdownItem, DropdownDivider, DropdownHeader } from './Dropdown';

const Base = (props) => (
  <Dropdown trigger={<button>Trigger</button>} {...props}>
    <DropdownItem>Opción 1</DropdownItem>
    <DropdownItem>Opción 2</DropdownItem>
  </Dropdown>
);

describe('Dropdown — API completa ui-core', () => {
  it('no muestra el panel por defecto', () => {
    render(<Base />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('click en trigger abre el menú', () => {
    render(<Base />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Trigger' })[0]);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('segundo click cierra (toggle)', () => {
    render(<Base />);
    const trigger = screen.getAllByRole('button', { name: 'Trigger' })[0];
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    // AnimatePresence mantiene el DOM durante exit — verificar aria-expanded
    expect(screen.getAllByRole('button', { name: 'Trigger' })[0].parentElement)
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('autoClose=true cierra al click en un item (default ui-core)', () => {
    render(<Base autoClose={true} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Trigger' })[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Opción 1' }));
    const triggerDiv = screen.getAllByRole('button', { name: 'Trigger' })[0].parentElement;
    expect(triggerDiv).toHaveAttribute('aria-expanded', 'false');
  });

  it('autoClose=false NO cierra al click en un item', () => {
    render(<Base autoClose={false} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Trigger' })[0]);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Opción 1' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('Escape cierra el menú', () => {
    render(<Base />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Trigger' })[0]);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getAllByRole('button', { name: 'Trigger' })[0].parentElement)
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('ArrowDown abre el menú si está cerrado', () => {
    render(<Base />);
    const trigger = screen.getAllByRole('button', { name: 'Trigger' })[0];
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('ref expone toggle / show / hide / dispose / update', () => {
    const ref = createRef();
    render(<Base ref={ref} />);
    ['toggle','show','hide','dispose','update'].forEach(m => {
      expect(typeof ref.current?.[m]).toBe('function');
    });
  });

  it('ref.show() abre y ref.hide() cierra', () => {
    const ref = createRef();
    const { rerender } = render(<Base ref={ref} />);
    act(() => ref.current.show());
    expect(screen.getByRole('menu')).toBeInTheDocument();
    act(() => ref.current.hide());
    expect(screen.getAllByRole('button')[0].parentElement)
      .toHaveAttribute('aria-expanded', 'false');
  });

  it('DropdownDivider renderiza un separador', () => {
    render(
      <Dropdown trigger={<button>T</button>}>
        <DropdownItem>A</DropdownItem>
        <DropdownDivider />
        <DropdownItem>B</DropdownItem>
      </Dropdown>
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'T' })[0]);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('DropdownHeader renderiza un encabezado de sección', () => {
    render(
      <Dropdown trigger={<button>T</button>}>
        <DropdownHeader>Sección</DropdownHeader>
        <DropdownItem>Item</DropdownItem>
      </Dropdown>
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'T' })[0]);
    expect(screen.getByText('Sección')).toBeInTheDocument();
  });
});
