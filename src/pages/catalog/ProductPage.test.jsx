/**
 * Tests — ProductPage (UC-CAT-02)
 */
import { render, screen } from '@testing-library/react';
import { Provider }       from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

import apiService from '@services/apiService';
import catalogReducer from '@redux/slices/catalogSlice';
import ProductPage from './ProductPage';

const makeStore = () =>
  configureStore({ reducer: { catalog: catalogReducer } });

const wrap = (slug, store) => (
  <Provider store={store}>
    <MemoryRouter initialEntries={[`/catalogo/${slug}`]}>
      <Routes>
        <Route path="/catalogo/:slug" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>
  </Provider>
);

const PRODUCT = {
  id: 1,
  name: 'Collar Oshun dorado',
  slug: 'collar-oshun-dorado',
  sku: 'OSHUN-001',
  description: 'Collar sagrado de Oshun para la prosperidad.',
  short_description: 'Collar de Oshun dorado.',
  base_price: '1250.00',
  price_with_tax: 1450.00,
  availability: 'IN_STOCK',
  stock: 10,
  is_featured: true,
  category: { id: 3, name: 'Collares', slug: 'collares' },
  images: [],
  discount: null,
};

afterEach(() => jest.clearAllMocks());

describe('ProductPage — ficha de producto (UC-CAT-02)', () => {
  beforeEach(() => {
    apiService.get.mockResolvedValue({ data: PRODUCT });
  });

  it('muestra el nombre del producto', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(await screen.findByRole('heading', { name: /Collar Oshun dorado/i }))
      .toBeInTheDocument();
  });

  it('muestra el SKU', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    const skuEls = await screen.findAllByText(/OSHUN-001/);
    expect(skuEls.length).toBeGreaterThan(0);
  });

  it('muestra el precio con IVA y la etiqueta', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(await screen.findByText(/1,450\.00/)).toBeInTheDocument();
    expect(screen.getByText(/precio con IVA incluido/i)).toBeInTheDocument();
  });

  it('muestra "Disponible" con stock cuando availability=IN_STOCK', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    // Buscar el span de disponibilidad por su clase de contenedor
    expect(await screen.findByText(/Disponible/i, { selector: 'span' })).toBeInTheDocument();
  });

  it('muestra "Sin stock" cuando availability=OUT_OF_STOCK', async () => {
    apiService.get.mockResolvedValue({
      data: { ...PRODUCT, availability: 'OUT_OF_STOCK', stock: 0 },
    });
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(await screen.findByText(/Sin stock/i)).toBeInTheDocument();
  });

  it('deshabilita el botón de carrito cuando sin stock', async () => {
    apiService.get.mockResolvedValue({
      data: { ...PRODUCT, availability: 'OUT_OF_STOCK', stock: 0 },
    });
    render(wrap('collar-oshun-dorado', makeStore()));
    const btn = await screen.findByRole('button', { name: /Sin disponibilidad/i });
    expect(btn).toBeDisabled();
  });

  it('habilita el botón de carrito cuando hay stock', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    const btn = await screen.findByRole('button', { name: /Agregar al carrito/i });
    expect(btn).not.toBeDisabled();
  });

  it('muestra la categoría del producto', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    const collaresEls = await screen.findAllByText('Collares');
    expect(collaresEls.length).toBeGreaterThan(0);
  });

  it('muestra la descripción completa', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(await screen.findByText(/Collar sagrado de Oshun/i)).toBeInTheDocument();
  });

  it('muestra la descripción corta', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(await screen.findByText(/Collar de Oshun dorado\./)).toBeInTheDocument();
  });

  it('muestra spinner mientras carga', () => {
    apiService.get.mockReturnValue(new Promise(() => {}));
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(screen.getByText(/Cargando producto/i)).toBeInTheDocument();
  });

  it('muestra "Producto no disponible" si el API falla', async () => {
    apiService.get.mockRejectedValue(new Error('404'));
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(await screen.findByRole('heading', { name: /Producto no disponible/i }))
      .toBeInTheDocument();
  });

  it('muestra breadcrumb con Catálogo y categoría', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    const nav = await screen.findByRole('navigation', { name: /Ruta de navegación/i });
    expect(nav).toHaveTextContent('Collares');
    expect(nav).toHaveTextContent('Catálogo');
  });

  it('muestra badge Destacado cuando is_featured=true', async () => {
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(await screen.findByText('Destacado')).toBeInTheDocument();
  });

  it('no muestra badge Destacado cuando is_featured=false', async () => {
    apiService.get.mockResolvedValue({ data: { ...PRODUCT, is_featured: false } });
    render(wrap('collar-oshun-dorado', makeStore()));
    await screen.findByRole('heading', { name: /Collar Oshun dorado/i });
    expect(screen.queryByText('Destacado')).not.toBeInTheDocument();
  });
});
