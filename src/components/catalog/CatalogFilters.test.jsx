/**
 * Tests — CatalogFilters (UC-CAT-04 + UC-CAT-05).
 * Rediseno T-11 (DEC-STF-11, opcion B): categoria multi-seleccion por
 * checkboxes, precio con RangeSlider + inputs, filtros activos como Chips
 * removibles.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import CatalogFilters from './CatalogFilters';

const BASE = process.env.API_URL || 'http://localhost:8000';

const TREE = [
  { id: 1, slug: 'collares', name: 'Collares', product_count: 5, children: [
    { id: 11, slug: 'collares-orisha', name: 'Collares Orisha', product_count: 3, children: [] },
  ] },
  { id: 2, slug: 'soperas', name: 'Soperas', product_count: 4, children: [] },
];

const renderFilters = (props = {}) => {
  server.use(
    http.get(`${BASE}/api/v2/categories/`, () =>
      HttpResponse.json({ results: TREE, count: TREE.length }),
    ),
  );
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const onChange = jest.fn();
  const utils = render(
    <QueryClientProvider client={client}>
      <CatalogFilters onChange={onChange} {...props} />
    </QueryClientProvider>,
  );
  return { ...utils, onChange };
};

describe('CatalogFilters (UC-CAT-04 + UC-CAT-05)', () => {
  it('renderiza un checkbox por categoria aplanada (UC-CAT-04)', async () => {
    renderFilters();
    expect(
      await screen.findByRole('checkbox', { name: /^collares$/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /collares orisha/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /^soperas$/i })).toBeInTheDocument();
  });

  it('emite onChange con category=[<slug>] al marcar un checkbox', async () => {
    const { onChange } = renderFilters();
    const soperas = await screen.findByRole('checkbox', { name: /^soperas$/i });
    fireEvent.click(soperas);
    expect(onChange).toHaveBeenCalledWith({ category: ['soperas'] });
  });

  it('agrega una segunda categoria a la seleccion existente (multi)', async () => {
    const { onChange } = renderFilters({ categories: ['collares'] });
    const soperas = await screen.findByRole('checkbox', { name: /^soperas$/i });
    fireEvent.click(soperas);
    expect(onChange).toHaveBeenCalledWith({ category: ['collares', 'soperas'] });
  });

  it('desmarca una categoria ya seleccionada', async () => {
    const { onChange } = renderFilters({ categories: ['collares', 'soperas'] });
    const collares = await screen.findByRole('checkbox', { name: /^collares$/i });
    fireEvent.click(collares);
    expect(onChange).toHaveBeenCalledWith({ category: ['soperas'] });
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
    const { onChange } = renderFilters({ categories: ['collares'], priceMin: '10', priceMax: '50' });
    fireEvent.click(screen.getByRole('button', { name: /limpiar filtros/i }));
    expect(onChange).toHaveBeenCalledWith({
      category: [], price_min: null, price_max: null,
    });
  });

  it('muestra un Chip por categoria activa y la quita con su boton', async () => {
    const { onChange } = renderFilters({ categories: ['collares'] });
    const removeBtn = await screen.findByRole('button', { name: /quitar collares/i });
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith({ category: [] });
  });

  it('quita el filtro de precio activo con el Chip de precio', () => {
    const { onChange } = renderFilters({ priceMin: '100', priceMax: '500' });
    fireEvent.click(screen.getByRole('button', { name: /quitar precio/i }));
    expect(onChange).toHaveBeenCalledWith({ price_min: null, price_max: null });
  });
});
