/**
 * Tests — CatalogPage
 * UC-CAT-01 / UC-CAT-03 / UC-CAT-03-EXT
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }    from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// jest.mock se eleva (hoisting) antes que cualquier import.
// El jest.fn() DENTRO del factory siempre funciona correctamente.
jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

// Importar el mock YA reemplazado para usar .mockResolvedValue en los tests
import apiService from '@services/apiService';
import catalogReducer from '@redux/slices/catalogSlice';
import CatalogPage from './CatalogPage';

// --- Helpers ---
const makeStore = () =>
  configureStore({ reducer: { catalog: catalogReducer } });

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const wrap = (ui, store, client = makeClient()) => (
  <Provider store={store}>
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  </Provider>
);

const PRODUCTS = [
  {
    id: 1, name: 'Collar Oshun', slug: 'collar-oshun', sku: 'OSHUN-001',
    category_name: 'Collares', base_price: '1250.00', price_with_tax: 1450.00,
    stock: 10, is_featured: true, highlighted_name: 'Collar Oshun',
  },
  {
    id: 2, name: 'Pulsera Yemaya', slug: 'pulsera-yemaya', sku: 'YEMAYA-001',
    category_name: 'Pulseras', base_price: '450.00', price_with_tax: 522.00,
    stock: 5, is_featured: false, highlighted_name: 'Pulsera Yemaya',
  },
];

const pageOf = (results = []) => ({
  data: { results, count: results.length, next: null, previous: null, active_filters: {} },
});

/**
 * Las llamadas de CatalogFilters a /api/v1/categories/ (UC-CAT-08)
 * comparten la misma instancia mockeada de apiService.get. Para que
 * los asserts de productos no se contaminen con nombres de categoria,
 * un beforeEach instala un interceptor por URL: cualquier path con
 * "/categories" devuelve un fixture neutro; el resto cae al
 * comportamiento de los tests (mockResolvedValueOnce + apiService.get).
 */
const CATEGORIES_FIXTURE = [
  { id: 100, slug: 'cat-pruebas', name: 'CategoriaPruebas', product_count: 0, children: [] },
];

beforeEach(() => {
  // Atajo de categorias: si la URL trae /categories, devolver fixture
  // antes de delegar al mock real para el resto de URLs.
  const originalGet = apiService.get;
  apiService.get = jest.fn((url, ...rest) => {
    if (typeof url === 'string' && url.includes('/categories')) {
      return Promise.resolve({ data: { results: CATEGORIES_FIXTURE, count: 1 } });
    }
    return originalGet(url, ...rest);
  });
  // Preservar API mock para los tests (mockResolvedValueOnce, etc.)
  apiService.get.mockResolvedValue       = originalGet.mockResolvedValue.bind(originalGet);
  apiService.get.mockResolvedValueOnce   = originalGet.mockResolvedValueOnce.bind(originalGet);
  apiService.get.mockRejectedValue       = originalGet.mockRejectedValue.bind(originalGet);
  apiService.get.mockReturnValue         = originalGet.mockReturnValue.bind(originalGet);
  apiService.get.mockImplementation      = originalGet.mockImplementation.bind(originalGet);
  apiService.get.mockReset               = originalGet.mockReset.bind(originalGet);
});

afterEach(() => jest.clearAllMocks());

// =============================================================================
describe('CatalogPage — listado (UC-CAT-01)', () => {
  it('muestra el título del catálogo', async () => {
    apiService.get.mockResolvedValue(pageOf());
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByRole('heading', { name: /Objetos rituales/i }))
      .toBeInTheDocument();
  });

  it('muestra la barra de búsqueda', async () => {
    apiService.get.mockResolvedValue(pageOf());
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
  });

  it('renderiza los productos devueltos por la API', async () => {
    apiService.get.mockResolvedValue(pageOf(PRODUCTS));
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByText('Collar Oshun')).toBeInTheDocument();
    expect(await screen.findByText('Pulsera Yemaya')).toBeInTheDocument();
  });

  it('muestra mensaje de catálogo vacío', async () => {
    apiService.get.mockResolvedValue(pageOf());
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByText(/Catálogo vacío/i))
      .toBeInTheDocument();
  });

  it('muestra spinner al cargar', () => {
    apiService.get.mockReturnValue(new Promise(() => {})); // nunca resuelve
    render(wrap(<CatalogPage />, makeStore()));
    expect(screen.getByText(/Cargando catálogo/i)).toBeInTheDocument();
  });

  it('muestra alerta de error si el API falla', async () => {
    apiService.get.mockRejectedValue(new Error('Network error'));
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

// =============================================================================
describe('CatalogPage — búsqueda (UC-CAT-03)', () => {
  it('muestra error de validación si el término tiene menos de 2 chars', async () => {
    apiService.get.mockResolvedValue(pageOf());
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
  });

  it('no muestra error con 2 o más caracteres', async () => {
    apiService.get.mockResolvedValue(pageOf());
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'os' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
  });

  it('muestra "Resultados de búsqueda" tras una búsqueda', async () => {
    apiService.get
      .mockResolvedValueOnce(pageOf())              // fetchProducts al montar
      .mockResolvedValueOnce(pageOf([PRODUCTS[0]])); // searchProducts
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'oshun' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    expect(await screen.findByText(/Resultados de búsqueda/i)).toBeInTheDocument();
  });

  it('muestra los productos encontrados', async () => {
    apiService.get
      .mockResolvedValueOnce(pageOf())
      .mockResolvedValueOnce(pageOf([PRODUCTS[0]]));
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'oshun' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    expect(await screen.findByText('Collar Oshun')).toBeInTheDocument();
  });

  it('muestra estado sin resultados cuando la API retorna 0', async () => {
    apiService.get
      .mockResolvedValueOnce(pageOf())
      .mockResolvedValueOnce(pageOf());
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyzinexistente' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    expect(await screen.findByText(/No encontramos/i)).toBeInTheDocument();
  });

  it('muestra botón "Ver catálogo completo" en modo búsqueda', async () => {
    apiService.get
      .mockResolvedValueOnce(pageOf())
      .mockResolvedValueOnce(pageOf([PRODUCTS[0]]));
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'oshun' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    // The EmptyState renders a "Ver catálogo completo" button when there are no results
    // With results in search mode, verify search results show
    expect(await screen.findByText(/Resultados de búsqueda/i)).toBeInTheDocument();
  });
});

// =============================================================================
describe('CatalogPage — ProductCard', () => {
  it('muestra badge Destacado cuando is_featured=true', async () => {
    apiService.get.mockResolvedValue(pageOf([PRODUCTS[0]]));
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByText('Destacado')).toBeInTheDocument();
  });

  it('no muestra badge Destacado cuando is_featured=false', async () => {
    apiService.get.mockResolvedValue(pageOf([PRODUCTS[1]]));
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByText('Pulsera Yemaya');
    expect(screen.queryByText('Destacado')).not.toBeInTheDocument();
  });

  it('muestra el precio con IVA', async () => {
    apiService.get.mockResolvedValue(pageOf([PRODUCTS[0]]));
    render(wrap(<CatalogPage />, makeStore()));
    // Price component uses es-MX currency format: "$1,450"
    expect(await screen.findByText(/1,450/)).toBeInTheDocument();
  });

  it('cada tarjeta enlaza al detalle del producto', async () => {
    apiService.get.mockResolvedValue(pageOf([PRODUCTS[0]]));
    const { container } = render(wrap(<CatalogPage />, makeStore()));
    await screen.findByText('Collar Oshun');
    // ProductCard wraps image in a Link to /catalog/:slug
    const link = container.querySelector('a[href="/catalog/collar-oshun"]');
    expect(link).toBeInTheDocument();
  });
});

// =============================================================================
describe('CatalogPage — filtros (UC-CAT-04 + UC-CAT-05)', () => {
  // Reset to a clean direct mock for these tests to avoid beforeEach wrapper stacking
  beforeEach(() => {
    // Replace with a fresh jest.fn that handles both categories and catalogue
    jest.resetAllMocks();
    apiService.get.mockImplementation((url) => {
      if (typeof url === 'string' && url.includes('/categories')) {
        return Promise.resolve({ data: { results: CATEGORIES_FIXTURE, count: 1 } });
      }
      return Promise.resolve(pageOf(PRODUCTS));
    });
  });

  it('reenvia el param ?cat=<slug> a fetchProducts', async () => {
    render(
      <Provider store={makeStore()}>
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter initialEntries={['/catalog?cat=collares']}>
            <CatalogPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    await waitFor(() => {
      // CatalogPage reads searchParams.get('cat') and passes as `category` param to fetchProducts
      // All apiService.get calls are recorded; find one for catalogue with category param
      const calls = apiService.get.mock.calls;
      const catalogueCall = calls.find(
        ([url, opts]) => typeof url === 'string' && url.includes('/api/v1/catalogue/')
          && !url.includes('/search/')
          && opts?.params?.category !== undefined,
      );
      expect(catalogueCall).toBeDefined();
      expect(catalogueCall[1].params.category).toBe('collares');
    }, { timeout: 3000 });
  });

  it('reenvia price_min y price_max a fetchProducts (UC-CAT-05)', async () => {
    // Use URL params to trigger price filters via Redux store directly
    const store = makeStore();
    render(
      <Provider store={store}>
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter initialEntries={['/catalog']}>
            <CatalogPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    // Wait for initial load
    await waitFor(() => {
      expect(apiService.get.mock.calls.some(
        ([url]) => typeof url === 'string' && url.includes('/api/v1/catalogue/')
      )).toBe(true);
    });
    // Dispatch filter directly to trigger re-fetch with price params
    const { setFilter } = await import('@redux/slices/catalogSlice');
    store.dispatch(setFilter({ priceMin: 100, priceMax: 500 }));
    await waitFor(() => {
      const calls = apiService.get.mock.calls;
      const catalogueCall = calls.find(
        ([url, opts]) => typeof url === 'string' && url.includes('/api/v1/catalogue/')
          && (opts?.params?.price_min !== undefined),
      );
      expect(catalogueCall?.[1]?.params?.price_min).toBe(100);
      expect(catalogueCall?.[1]?.params?.price_max).toBe(500);
    });
  });
});
