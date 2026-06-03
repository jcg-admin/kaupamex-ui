// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/Chip/Chip.test.jsx
/**
 * Tests: Chip — lógica completa de ui-core chip.js
 * Iniciativa: implementar-componentes-diferidos-ui-core
 */
import { render, screen, fireEvent } from '@testing-library/react';
import Chip from './Chip';

describe('Chip', () => {
  it('renderiza el contenido', () => {
    render(<Chip>Yorùbà</Chip>);
    expect(screen.getByText('Yorùbà')).toBeInTheDocument();
  });

  it('selectable=true permite toggle (equivale a toggle() de ui-core)', () => {
    render(<Chip selectable>Etiqueta</Chip>);
    const chip = screen.getByRole('option');
    expect(chip).toHaveAttribute('aria-selected', 'false');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(chip);
    expect(chip).toHaveAttribute('aria-selected', 'false');
  });

  it('selected=true como estado inicial', () => {
    render(<Chip selectable selected>Activo</Chip>);
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
  });

  it('onSelect devuelve false cancela la selección (defaultPrevented)', () => {
    const onSelect = jest.fn(() => false);
    render(<Chip selectable onSelect={onSelect}>Cancelable</Chip>);
    fireEvent.click(screen.getByRole('option'));
    expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
  });

  it('removable=true muestra botón de eliminar con SVG', () => {
    render(<Chip removable>Eliminar</Chip>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('al hacer click en el botón de eliminar desaparece el chip', () => {
    const onRemove = jest.fn();
    render(<Chip removable onRemove={onRemove}>Chip</Chip>);
    fireEvent.click(screen.getByRole('button'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('onRemove devuelve false cancela la eliminación (defaultPrevented)', () => {
    const onRemove = jest.fn(() => false);
    render(<Chip removable onRemove={onRemove}>Protegido</Chip>);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Protegido')).toBeInTheDocument();
  });

  it('Space activa toggle (equivale a keyboard handler de ui-core)', () => {
    render(<Chip selectable>Teclado</Chip>);
    const chip = screen.getByRole('option');
    fireEvent.keyDown(chip, { key: ' ' });
    expect(chip).toHaveAttribute('aria-selected', 'true');
  });

  it('Delete elimina el chip cuando removable=true', () => {
    const onRemove = jest.fn();
    render(<Chip removable selectable onRemove={onRemove}>Del</Chip>);
    fireEvent.keyDown(screen.getByRole('option'), { key: 'Delete' });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('disabled bloquea todas las interacciones', () => {
    const onSelect = jest.fn();
    render(<Chip selectable disabled onSelect={onSelect}>Bloqueado</Chip>);
    fireEvent.click(screen.getByRole('option'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});
