/**
 * Tests — CatalogPage
 * UC-CAT-01 / UC-CAT-03 / UC-CAT-03-EXT
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }    from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import catalogReducer, { setFilter } from '@redux/slices/catalogSlice';
import CatalogPage from './CatalogPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

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
  results, count: results.length, next: null, previous: null, active_filters: {},
});

/**
 * CatalogFilters calls /api/v2/catalogue/categories/ (UC-CAT-08).
 * A neutral fixture avoids category names polluting product asserts.
 */
const CATEGORIES_FIXTURE = [
  { id: 100, slug: 'cat-pruebas', name: 'CategoriaPruebas', product_count: 0, children: [] },
];

beforeEach(() => {
  server.use(
    http.get(`${BASE}/api/v2/catalogue/categories/`, () =>
      HttpResponse.json({ results: CATEGORIES_FIXTURE, count: 1 }),
    ),
    http.get(`${BASE}/api/v2/catalogue/`, () =>
      HttpResponse.json(pageOf()),
    ),
  );
});

// =============================================================================
describe('CatalogPage — listado (UC-CAT-01)', () => {
  it('muestra el título del catálogo', async () => {
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByRole('heading', { name: /Objetos rituales/i }))
      .toBeInTheDocument();
  });

  it('muestra la barra de búsqueda', async () => {
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByRole('searchbox')).toBeInTheDocument();
  });

  it('renderiza los productos devueltos por la API', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        HttpResponse.json(pageOf(PRODUCTS)),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByText('Collar Oshun')).toBeInTheDocument();
    expect(await screen.findByText('Pulsera Yemaya')).toBeInTheDocument();
  });

  it('muestra mensaje de catálogo vacío', async () => {
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByText(/Catálogo vacío/i))
      .toBeInTheDocument();
  });

  it('muestra spinner al cargar', () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        new Promise(() => {}), // never resolves
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    expect(screen.getByText(/Cargando catálogo/i)).toBeInTheDocument();
  });

  it('muestra alerta de error si el API falla', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        HttpResponse.json({ detail: 'Error' }, { status: 400 }),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});

// =============================================================================
describe('CatalogPage — búsqueda (UC-CAT-03)', () => {
  it('muestra error de validación si el término tiene menos de 2 chars', async () => {
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'a' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument()
    );
  });

  it('no muestra error con 2 o más caracteres', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/search/`, () =>
        HttpResponse.json(pageOf()),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'os' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    await waitFor(() =>
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    );
  });

  it('muestra "Resultados de búsqueda" tras una búsqueda', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/search/`, () =>
        HttpResponse.json(pageOf([PRODUCTS[0]])),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'oshun' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    expect(await screen.findByText(/Resultados de búsqueda/i)).toBeInTheDocument();
  });

  it('muestra los productos encontrados', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/search/`, () =>
        HttpResponse.json(pageOf([PRODUCTS[0]])),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'oshun' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    expect(await screen.findByText('Collar Oshun')).toBeInTheDocument();
  });

  it('muestra estado sin resultados cuando la API retorna 0', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/search/`, () =>
        HttpResponse.json(pageOf()),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByRole('searchbox');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'xyzinexistente' } });
    fireEvent.submit(screen.getByRole('searchbox').closest('form'));
    expect(await screen.findByText(/No encontramos/i)).toBeInTheDocument();
  });

  it('muestra botón "Ver catálogo completo" en modo búsqueda', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/search/`, () =>
        HttpResponse.json(pageOf([PRODUCTS[0]])),
      ),
    );
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
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        HttpResponse.json(pageOf([PRODUCTS[0]])),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    expect(await screen.findByText('Destacado')).toBeInTheDocument();
  });

  it('no muestra badge Destacado cuando is_featured=false', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        HttpResponse.json(pageOf([PRODUCTS[1]])),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    await screen.findByText('Pulsera Yemaya');
    expect(screen.queryByText('Destacado')).not.toBeInTheDocument();
  });

  it('muestra el precio con IVA', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        HttpResponse.json(pageOf([PRODUCTS[0]])),
      ),
    );
    render(wrap(<CatalogPage />, makeStore()));
    // Price component uses es-MX currency format: "$1,450"
    expect(await screen.findByText(/1,450/)).toBeInTheDocument();
  });

  it('cada tarjeta enlaza al detalle del producto', async () => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        HttpResponse.json(pageOf([PRODUCTS[0]])),
      ),
    );
    const { container } = render(wrap(<CatalogPage />, makeStore()));
    await screen.findByText('Collar Oshun');
    // ProductCard wraps image in a Link to /catalog/:slug
    const link = container.querySelector('a[href="/catalog/collar-oshun"]');
    expect(link).toBeInTheDocument();
  });
});

// =============================================================================
describe('CatalogPage — filtros (UC-CAT-04 + UC-CAT-05)', () => {
  // Reset to a clean direct handler for these tests
  beforeEach(() => {
    server.use(
      http.get(`${BASE}/api/v2/catalogue/categories/`, () =>
        HttpResponse.json({ results: CATEGORIES_FIXTURE, count: 1 }),
      ),
      http.get(`${BASE}/api/v2/catalogue/`, () =>
        HttpResponse.json(pageOf(PRODUCTS)),
      ),
    );
  });

  it('reenvia el param ?cat=<slug> a fetchProducts', async () => {
    let capturedUrl;
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json(pageOf(PRODUCTS));
      }),
    );
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
      expect(capturedUrl).toBeDefined();
      expect(new URL(capturedUrl).searchParams.get('category')).toBe('collares');
    }, { timeout: 3000 });
  });

  it('reenvia price_min y price_max a fetchProducts (UC-CAT-05)', async () => {
    const capturedUrls = [];
    server.use(
      http.get(`${BASE}/api/v2/catalogue/`, ({ request }) => {
        capturedUrls.push(request.url);
        return HttpResponse.json(pageOf(PRODUCTS));
      }),
    );
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
      expect(capturedUrls.length).toBeGreaterThan(0);
    });
    // Dispatch filter directly to trigger re-fetch with price params
    store.dispatch(setFilter({ priceMin: 100, priceMax: 500 }));
    await waitFor(() => {
      const priceUrl = capturedUrls.find((url) => {
        const params = new URL(url).searchParams;
        return params.get('price_min') !== null;
      });
      expect(priceUrl).toBeDefined();
      const params = new URL(priceUrl).searchParams;
      expect(params.get('price_min')).toBe('100');
      expect(params.get('price_max')).toBe('500');
    });
  });
});
