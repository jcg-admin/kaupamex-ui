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
    expect(await screen.findByRole('heading', { name: /Catálogo Yoruba/i }))
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
    expect(await screen.findByText(/no tiene productos disponibles/i))
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
    expect(await screen.findByText(/No encontramos productos/i)).toBeInTheDocument();
  });

  it('muestra botón "Ver catálogo completo" en modo búsqueda', async () => {
    apiService.get
      .mockResolvedValueOnce(pageOf())
      .mockResolvedValueOnce(pageOf([PRODUCTS[0]]));
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'oshun' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    expect(await screen.findByRole('button', { name: /Ver catálogo completo/i }))
      .toBeInTheDocument();
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
    expect(await screen.findByText(/1,450\.00/)).toBeInTheDocument();
    expect(screen.getByText('con IVA')).toBeInTheDocument();
  });

  it('cada tarjeta enlaza al detalle del producto', async () => {
    apiService.get.mockResolvedValue(pageOf([PRODUCTS[0]]));
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByText('Collar Oshun');
    const link = screen.getByRole('link', { name: /Collar Oshun/i });
    expect(link).toHaveAttribute('href', '/catalog/collar-oshun');
  });
});

// =============================================================================
describe('CatalogPage — filtros (UC-CAT-04 + UC-CAT-05)', () => {
  it('reenvia el param ?category=<slug> a fetchProducts', async () => {
    apiService.get.mockResolvedValue(pageOf(PRODUCTS));
    render(
      <Provider store={makeStore()}>
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter initialEntries={['/catalog?category=collares']}>
            <CatalogPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    await waitFor(() => {
      const calls = apiService.get.mock.calls;
      const catalogueCall = calls.find(
        ([url]) => typeof url === 'string' && url.includes('/api/v1/catalogue/'),
      );
      expect(catalogueCall?.[1]?.params?.category).toBe('collares');
    });
  });

  it('reenvia price_min y price_max a fetchProducts (UC-CAT-05)', async () => {
    apiService.get.mockResolvedValue(pageOf(PRODUCTS));
    render(
      <Provider store={makeStore()}>
        <QueryClientProvider client={makeClient()}>
          <MemoryRouter initialEntries={['/catalog?price_min=100&price_max=500']}>
            <CatalogPage />
          </MemoryRouter>
        </QueryClientProvider>
      </Provider>,
    );
    await waitFor(() => {
      const calls = apiService.get.mock.calls;
      const catalogueCall = calls.find(
        ([url]) => typeof url === 'string' && url.includes('/api/v1/catalogue/'),
      );
      expect(catalogueCall?.[1]?.params?.price_min).toBe('100');
      expect(catalogueCall?.[1]?.params?.price_max).toBe('500');
    });
  });
});
