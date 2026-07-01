/**
 * useSortableList — reordenamiento por arrastre (HTML5 DnD) + teclado.
 */
import { render, fireEvent } from '@testing-library/react';
import useSortableList, { arrayMove } from './useSortableList';

describe('arrayMove', () => {
  it('mueve hacia adelante', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });
  it('mueve hacia atrás', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('no muta el original y es no-op si from===to o fuera de rango', () => {
    const orig = ['a', 'b', 'c'];
    expect(arrayMove(orig, 1, 1)).toEqual(['a', 'b', 'c']);
    expect(arrayMove(orig, 0, 9)).toEqual(['a', 'b', 'c']);
    expect(orig).toEqual(['a', 'b', 'c']);
  });
});

function List({ onReorder, items = ['a', 'b', 'c'] }) {
  const { getItemProps } = useSortableList(items.length, onReorder);
  return (
    <ul>
      {items.map((it, i) => (
        <li key={it} data-testid={`item-${i}`} tabIndex={0} {...getItemProps(i)}>{it}</li>
      ))}
    </ul>
  );
}

describe('useSortableList (DnD + teclado)', () => {
  it('arrastrar item 0 sobre item 2 dispara onReorder(0,2)', () => {
    const onReorder = jest.fn();
    const { getByTestId } = render(<List onReorder={onReorder} />);
    fireEvent.dragStart(getByTestId('item-0'));
    fireEvent.dragOver(getByTestId('item-2'));
    fireEvent.drop(getByTestId('item-2'));
    expect(onReorder).toHaveBeenCalledWith(0, 2);
  });

  it('soltar sobre el mismo índice no reordena', () => {
    const onReorder = jest.fn();
    const { getByTestId } = render(<List onReorder={onReorder} />);
    fireEvent.dragStart(getByTestId('item-1'));
    fireEvent.drop(getByTestId('item-1'));
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('Ctrl+ArrowUp mueve el item enfocado una posición arriba', () => {
    const onReorder = jest.fn();
    const { getByTestId } = render(<List onReorder={onReorder} />);
    fireEvent.keyDown(getByTestId('item-2'), { key: 'ArrowUp', ctrlKey: true });
    expect(onReorder).toHaveBeenCalledWith(2, 1);
  });

  it('Ctrl+ArrowUp en el primer item no hace nada', () => {
    const onReorder = jest.fn();
    const { getByTestId } = render(<List onReorder={onReorder} />);
    fireEvent.keyDown(getByTestId('item-0'), { key: 'ArrowUp', ctrlKey: true });
    expect(onReorder).not.toHaveBeenCalled();
  });
});
