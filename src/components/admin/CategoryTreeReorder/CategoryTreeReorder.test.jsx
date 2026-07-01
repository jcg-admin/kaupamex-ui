/**
 * CategoryTreeReorder — árbol + reorden de hermanos (UC-ADM-01).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { buildTree, parentIdOf } from './categoryTree';
import CategoryTreeReorder from './index';
import apiService from '@services/apiService';

jest.mock('@services/apiService', () => ({ __esModule: true, default: { post: jest.fn() } }));

const CATS = [
  { id: 1, name: 'R1', parent_id: null, order: 0 },
  { id: 2, name: 'R2', parent_id: null, order: 1 },
  { id: 3, name: 'C1', parent_id: 1, order: 0 },
];

describe('buildTree', () => {
  it('anida hijos bajo su padre y ordena por order', () => {
    const tree = buildTree([
      { id: 2, name: 'R2', parent_id: null, order: 1 },
      { id: 1, name: 'R1', parent_id: null, order: 0 },
      { id: 3, name: 'C1', parent_id: 1, order: 0 },
    ]);
    expect(tree.map((n) => n.name)).toEqual(['R1', 'R2']); // ordenado por order
    expect(tree[0].children.map((n) => n.name)).toEqual(['C1']);
  });

  it('parentIdOf soporta parent_id plano y parent.{id}', () => {
    expect(parentIdOf({ parent_id: 5 })).toBe(5);
    expect(parentIdOf({ parent: { id: 7 } })).toBe(7);
    expect(parentIdOf({})).toBeNull();
  });
});

describe('CategoryTreeReorder', () => {
  beforeEach(() => apiService.post.mockReset());

  it('renderiza el árbol (raíces e hijos)', () => {
    render(<CategoryTreeReorder categories={CATS} />);
    expect(screen.getByText('R1')).toBeInTheDocument();
    expect(screen.getByText('C1')).toBeInTheDocument();
  });

  it('reordena raíces por teclado y persiste {parent:null, order}', async () => {
    apiService.post.mockResolvedValue({ data: {} });
    const onReordered = jest.fn();
    render(<CategoryTreeReorder categories={CATS} onReordered={onReordered} />);
    const row = screen.getByText('R1').closest('[tabindex]');
    fireEvent.keyDown(row, { key: 'ArrowDown', ctrlKey: true }); // R1 baja
    await waitFor(() => expect(apiService.post).toHaveBeenCalledWith(
      '/api/v2/admin/categories/reorder/',
      { parent: null, order: [2, 1] },
    ));
    await waitFor(() => expect(onReordered).toHaveBeenCalled());
  });

  it('muestra error si el backend falla', async () => {
    apiService.post.mockRejectedValue(new Error('fail'));
    render(<CategoryTreeReorder categories={CATS} />);
    fireEvent.keyDown(screen.getByText('R1').closest('[tabindex]'), { key: 'ArrowDown', ctrlKey: true });
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar/i);
  });
});
