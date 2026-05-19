/**
 * Tests — CatalogFilters (UC-CAT-04 + UC-CAT-05).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import CatalogFilters from './CatalogFilters';

const TREE = [
  { id: 1, slug: 'collares', name: 'Collares', product_count: 5, children: [
    { id: 11, slug: 'collares-orisha', name: 'Collares Orisha', product_count: 3, children: [] },
  ] },
  { id: 2, slug: 'soperas', name: 'Soperas', product_count: 4, children: [] },
];

const renderFilters = (props = {}) => {
  apiService.get.mockResolvedValue({ data: { results: TREE, count: TREE.length } });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onChange = jest.fn();
  const utils = render(
    <QueryClientProvider client={client}>
      <CatalogFilters onChange={onChange} {...props} />
    </QueryClientProvider>,
  );
  return { ...utils, onChange };
};

afterEach(() => jest.clearAllMocks());

describe('CatalogFilters (UC-CAT-04 + UC-CAT-05)', () => {
  it('renderiza un selector con las categorias aplanadas (UC-CAT-04)', async () => {
    renderFilters();
    expect(
      await screen.findByRole('option', { name: /^collares$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /collares orisha/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /^soperas$/i })).toBeInTheDocument();
  });

  it('emite onChange con category=<slug> al seleccionar una categoria', async () => {
    const { onChange } = renderFilters();
    await screen.findByRole('option', { name: /^soperas$/i });
    fireEvent.change(screen.getByLabelText(/categoria/i), {
      target: { value: 'soperas' },
    });
    expect(onChange).toHaveBeenCalledWith({ category: 'soperas' });
  });

  it('emite onChange con price_min y price_max al aplicar precio (UC-CAT-05)', () => {
    const { onChange } = renderFilters();
    fireEvent.change(screen.getByLabelText(/precio minimo/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/precio maximo/i), { target: { value: '500' } });
    fireEvent.click(screen.getByRole('button', { name: /aplicar precio/i }));
    expect(onChange).toHaveBeenCalledWith({ price_min: 100, price_max: 500 });
  });

  it('rechaza precio maximo menor que minimo y muestra error inline', () => {
    const { onChange } = renderFilters();
    fireEvent.change(screen.getByLabelText(/precio minimo/i), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/precio maximo/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /aplicar precio/i }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(/maximo no puede ser menor/i);
  });

  it('emite onChange limpio al pulsar «Limpiar filtros»', () => {
    const { onChange } = renderFilters({ category: 'collares', priceMin: '10', priceMax: '50' });
    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(onChange).toHaveBeenCalledWith({
      category: null, price_min: null, price_max: null,
    });
  });
});
