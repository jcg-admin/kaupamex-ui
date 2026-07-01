/**
 * ProductImageReorder — drag/teclado + persistencia (UC-ADM-05).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductImageReorder from './index';
import apiService from '@services/apiService';

jest.mock('@services/apiService', () => ({ __esModule: true, default: { post: jest.fn() } }));

const IMAGES = [
  { id: 10, image_url: 'a.jpg', alt_text: 'A', order: 0 },
  { id: 20, image_url: 'b.jpg', alt_text: 'B', order: 1 },
  { id: 30, image_url: 'c.jpg', alt_text: 'C', order: 2 },
];

beforeEach(() => apiService.post.mockReset());

describe('ProductImageReorder', () => {
  it('no renderiza con menos de 2 imágenes', () => {
    const { container } = render(<ProductImageReorder productId={1} images={[IMAGES[0]]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('reordena por teclado y persiste el nuevo orden de IDs', async () => {
    apiService.post.mockResolvedValue({ data: {} });
    render(<ProductImageReorder productId={5} images={IMAGES} />);
    const items = screen.getAllByRole('listitem');
    fireEvent.keyDown(items[0], { key: 'ArrowDown', ctrlKey: true }); // 0 -> 1
    await waitFor(() => expect(apiService.post).toHaveBeenCalled());
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v2/admin/products/5/reorder-images/',
      { order: [20, 10, 30] },
    );
  });

  it('revierte y muestra error si el backend falla', async () => {
    apiService.post.mockRejectedValue(new Error('fail'));
    render(<ProductImageReorder productId={5} images={IMAGES} />);
    fireEvent.keyDown(screen.getAllByRole('listitem')[0], { key: 'ArrowDown', ctrlKey: true });
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo guardar/i);
  });
});
