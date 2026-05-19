/**
 * Tests — ProductPage (UC-CAT-02)
 */
import { render, screen } from '@testing-library/react';
import { Provider }       from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import catalogReducer from '@redux/slices/catalogSlice';
import cartReducer from '@redux/slices/cartSlice';
import yorubaVariantsReducer, {
  selectVariant,
} from '@redux/slices/yorubaVariantsSlice';
import ProductPage from './ProductPage';

const makeStore = () =>
  configureStore({
    reducer: {
      catalog:        catalogReducer,
      cart:           cartReducer,
      yorubaVariants: yorubaVariantsReducer,
    },
  });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (slug, store, client = makeClient()) => (
  <Provider store={store}>
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/catalog/${slug}`]}>
        <Routes>
          <Route path="/catalog/:slug" element={<ProductPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
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

  // ── UC-CHT-01: integración del selector de variantes en la ficha ──────
  it('UC-CHT-01: renderiza el selector de variantes cuando el producto las trae', async () => {
    apiService.get.mockResolvedValue({
      data: {
        ...PRODUCT,
        variants: [
          { id: 1, name: 'Chico',   price: 1200, stock: 5, is_active: true },
          { id: 2, name: 'Mediano', price: 1500, stock: 3, is_active: true },
        ],
      },
    });
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(
      await screen.findByRole('group', { name: /variantes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Chico/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mediano/ })).toBeInTheDocument();
  });

  it('UC-CHT-02: al hacer click sobre Agregar al carrito con variante seleccionada llama al API con variant_id', async () => {
    const { fireEvent } = require('@testing-library/react');
    apiService.get.mockResolvedValue({
      data: {
        ...PRODUCT,
        variants: [
          { id: 1, name: 'Chico',   price: 1200, stock: 4, is_active: true },
          { id: 2, name: 'Mediano', price: 1500, stock: 3, is_active: true },
        ],
      },
    });
    apiService.post.mockResolvedValue({ data: { items: [], voucher: null } });
    const store = makeStore();
    render(wrap('collar-oshun-dorado', store));

    fireEvent.click(await screen.findByRole('button', { name: /Chico/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Agregar al carrito$/ }));

    await screen.findByRole('status');
    expect(apiService.post).toHaveBeenCalledWith(
      '/api/cart/items/',
      expect.objectContaining({
        product_id: PRODUCT.id,
        variant_id: 1,
        quantity:   1,
      }),
    );
  });

  it('UC-CHT-01: el CTA pide seleccionar variante si hay variantes pero ninguna seleccionada', async () => {
    apiService.get.mockResolvedValue({
      data: {
        ...PRODUCT,
        variants: [
          { id: 1, name: 'Chico',   price: 1200, stock: 4, is_active: true },
          { id: 2, name: 'Mediano', price: 1500, stock: 3, is_active: true },
        ],
      },
    });
    render(wrap('collar-oshun-dorado', makeStore()));
    expect(
      await screen.findByRole('button', { name: /Selecciona una variante/i }),
    ).toBeDisabled();
  });

  // ─── D-019: regresion del cambio de precio al cambiar variante ─────────
  // Backend desbloqueado en apps/chartsize commit 5e72899. El contrato
  // real (ProductVariantSerializer) expone los campos:
  //    label, slug, sku_suffix, stock, is_available,
  //    effective_price, price_with_tax
  // Estos tests usan el shape REAL — no el shape heredado { name, price }.
  describe('UC-CHT-02 — variant price regression (D-019, real contract)', () => {
    const REAL_VARIANTS = [
      {
        id: 11, label: 'Chico', slug: 'chico', sku_suffix: '-CH',
        stock: 4, is_available: true,
        effective_price: '1200.00', price_with_tax: 1392.00,
      },
      {
        id: 12, label: 'Mediano', slug: 'mediano', sku_suffix: '-MD',
        stock: 3, is_available: true,
        effective_price: '1500.00', price_with_tax: 1740.00,
      },
      {
        id: 13, label: 'Grande', slug: 'grande', sku_suffix: '-LG',
        stock: 0, is_available: false,
        effective_price: '1800.00', price_with_tax: 2088.00,
      },
    ];

    const productWithRealVariants = { ...PRODUCT, variants: REAL_VARIANTS };

    it('renderiza el label real (no el legacy field name) por variante', async () => {
      apiService.get.mockResolvedValue({ data: productWithRealVariants });
      render(wrap('collar-oshun-dorado', makeStore()));
      expect(await screen.findByRole('button', { name: /Chico/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mediano/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Grande/ })).toBeInTheDocument();
    });

    it('muestra price_with_tax (no effective_price) en el selector', async () => {
      apiService.get.mockResolvedValue({ data: productWithRealVariants });
      render(wrap('collar-oshun-dorado', makeStore()));
      await screen.findByRole('button', { name: /Chico/ });
      // price_with_tax = 1392 para "Chico"
      expect(screen.getByText(/1,392/)).toBeInTheDocument();
      // price_with_tax = 1740 para "Mediano"
      expect(screen.getByText(/1,740/)).toBeInTheDocument();
    });

    it('al seleccionar una variante, el precio principal se actualiza al price_with_tax de esa variante', async () => {
      apiService.get.mockResolvedValue({ data: productWithRealVariants });
      const store = makeStore();
      const { container } = render(wrap('collar-oshun-dorado', store));

      // Inicialmente muestra el price_with_tax base del producto (1450.00).
      expect(await screen.findByText(/1,450\.00/)).toBeInTheDocument();

      // Selecciona "Mediano" (price_with_tax = 1740).
      const { fireEvent } = require('@testing-library/react');
      fireEvent.click(screen.getByRole('button', { name: /Mediano/ }));

      // El precio principal cambia al precio con IVA de la variante.
      // Aparece tambien dentro del boton de la variante; aqui solo
      // queremos verificar que al menos UNO de los elementos rendereados
      // (el del area principal) muestre 1,740.00.
      await screen.findAllByText(/1,740\.00/);
      const all1740 = screen.getAllByText(/1,740\.00/);
      expect(all1740.length).toBeGreaterThanOrEqual(2);
    });

    it('cambiar entre dos variantes refleja el precio de la variante recien seleccionada', async () => {
      apiService.get.mockResolvedValue({ data: productWithRealVariants });
      const store = makeStore();
      render(wrap('collar-oshun-dorado', store));
      await screen.findByRole('button', { name: /Chico/ });

      const { fireEvent } = require('@testing-library/react');
      fireEvent.click(screen.getByRole('button', { name: /Chico/ }));
      await screen.findAllByText(/1,392\.00/);
      // Despues de seleccionar Chico: 1,392 aparece tanto en el boton de
      // la variante como en el area principal del precio.
      expect(screen.getAllByText(/1,392\.00/).length).toBeGreaterThanOrEqual(2);

      fireEvent.click(screen.getByRole('button', { name: /Mediano/ }));
      await screen.findAllByText(/1,740\.00/);
      expect(screen.getAllByText(/1,740\.00/).length).toBeGreaterThanOrEqual(2);
    });

    it('la variante con stock=0 queda deshabilitada (is_available=false) y no es seleccionable', async () => {
      apiService.get.mockResolvedValue({ data: productWithRealVariants });
      render(wrap('collar-oshun-dorado', makeStore()));
      const grande = await screen.findByRole('button', { name: /Grande/ });
      expect(grande).toBeDisabled();
    });

    it('el POST al carrito incluye el variant_id seleccionado del contrato real', async () => {
      apiService.get.mockResolvedValue({ data: productWithRealVariants });
      apiService.post.mockResolvedValue({ data: { items: [], voucher: null } });
      const store = makeStore();
      render(wrap('collar-oshun-dorado', store));

      const { fireEvent } = require('@testing-library/react');
      fireEvent.click(await screen.findByRole('button', { name: /Mediano/ }));
      fireEvent.click(screen.getByRole('button', { name: /^Agregar al carrito$/ }));

      await screen.findByRole('status');
      expect(apiService.post).toHaveBeenCalledWith(
        '/api/cart/items/',
        expect.objectContaining({
          product_id: PRODUCT.id,
          variant_id: 12,
          quantity:   1,
        }),
      );
    });
  });
});
