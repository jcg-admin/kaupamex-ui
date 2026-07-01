/**
 * ProductImageFieldArray — edición en lote de metadata (UC-ADM-06).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductImageFieldArray from './index';
import apiService from '@services/apiService';

jest.mock('@services/apiService', () => ({ __esModule: true, default: { patch: jest.fn() } }));

const IMAGES = [
  { id: 10, image_url: 'a.jpg', alt_text: 'A', order: 0, is_cover: true },
  { id: 20, image_url: 'b.jpg', alt_text: 'B', order: 1, is_cover: false },
  { id: 30, image_url: 'c.jpg', alt_text: 'C', order: 2, is_cover: false },
];

beforeEach(() => apiService.patch.mockReset());

describe('ProductImageFieldArray', () => {
  it('no renderiza sin imágenes', () => {
    const { container } = render(<ProductImageFieldArray productId={1} images={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('persiste alt_text e is_cover editados', async () => {
    apiService.patch.mockResolvedValue({ data: {} });
    render(<ProductImageFieldArray productId={7} images={IMAGES} />);

    const inputs = screen.getAllByLabelText('Texto alternativo');
    fireEvent.change(inputs[1], { target: { value: 'Nueva B' } });

    // marcar la 3ra como portada (radio de selección única)
    const covers = screen.getAllByRole('radio');
    fireEvent.click(covers[2]);

    fireEvent.click(screen.getByRole('button', { name: /guardar imágenes/i }));

    await waitFor(() => expect(apiService.patch).toHaveBeenCalled());
    expect(apiService.patch).toHaveBeenCalledWith(
      '/api/v2/admin/products/7/images/',
      { images: [
        { id: 10, alt_text: 'A', is_cover: false },
        { id: 20, alt_text: 'Nueva B', is_cover: false },
        { id: 30, alt_text: 'C', is_cover: true },
      ] },
    );
  });

  it('la portada es de selección única (marcar una desmarca las demás)', () => {
    render(<ProductImageFieldArray productId={7} images={IMAGES} />);
    const covers = screen.getAllByRole('radio');
    expect(covers[0].checked).toBe(true);
    fireEvent.click(covers[2]);
    expect(covers[0].checked).toBe(false);
    expect(covers[2].checked).toBe(true);
  });

  it('muestra error si el backend falla', async () => {
    apiService.patch.mockRejectedValue(new Error('fail'));
    render(<ProductImageFieldArray productId={7} images={IMAGES} />);
    fireEvent.click(screen.getByRole('button', { name: /guardar imágenes/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudieron guardar/i);
  });

  it('muestra confirmación al guardar bien', async () => {
    apiService.patch.mockResolvedValue({ data: {} });
    render(<ProductImageFieldArray productId={7} images={IMAGES} />);
    fireEvent.click(screen.getByRole('button', { name: /guardar imágenes/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/guardados/i);
  });
});
