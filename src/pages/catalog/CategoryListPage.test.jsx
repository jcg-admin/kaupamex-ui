/**
 * Tests — CategoryListPage (UC-CAT-08).
 *
 * Listado publico del arbol jerarquico de categorias. Read-only,
 * React Query contra GET /api/v2/categories/.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import CategoryListPage from './CategoryListPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const TREE = [
  {
    id: 1, name: 'Orishas', slug: 'orishas',
    product_count: 12, icon: null, parent: null,
    children: [
      { id: 11, name: 'Yemaya',  slug: 'yemaya',  product_count: 4, parent: 1, children: [] },
      { id: 12, name: 'Oshun',   slug: 'oshun',   product_count: 5, parent: 1, children: [] },
    ],
  },
  {
    id: 2, name: 'Soperas', slug: 'soperas',
    product_count: 7, icon: null, parent: null, children: [],
  },
];

const renderPage = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <CategoryListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('CategoryListPage (UC-CAT-08)', () => {
  it('muestra heading «Categorías»', async () => {
    server.use(
      http.get(`${BASE}/api/v2/categories/`, () =>
        HttpResponse.json({ results: TREE, count: TREE.length }),
      ),
    );
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /categorías/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renderiza los nodos raiz con su conteo de productos', async () => {
    server.use(
      http.get(`${BASE}/api/v2/categories/`, () =>
        HttpResponse.json({ results: TREE, count: TREE.length }),
      ),
    );
    renderPage();
    expect(await screen.findByText('Orishas')).toBeInTheDocument();
    expect(screen.getByText('Soperas')).toBeInTheDocument();
    expect(screen.getByText(/12 productos/i)).toBeInTheDocument();
    expect(screen.getByText(/7 productos/i)).toBeInTheDocument();
  });

  it('expande subcategorias al pulsar el toggle del nodo padre', async () => {
    server.use(
      http.get(`${BASE}/api/v2/categories/`, () =>
        HttpResponse.json({ results: TREE, count: TREE.length }),
      ),
    );
    renderPage();
    await screen.findByText('Orishas');
    // Subcategorias no visibles hasta expandir
    expect(screen.queryByText('Yemaya')).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /expandir orishas/i });
    fireEvent.click(toggle);

    expect(await screen.findByText('Yemaya')).toBeInTheDocument();
    expect(screen.getByText('Oshun')).toBeInTheDocument();
  });

  it('genera enlace a /catalog?category=<slug> en cada categoria', async () => {
    server.use(
      http.get(`${BASE}/api/v2/categories/`, () =>
        HttpResponse.json({ results: TREE, count: TREE.length }),
      ),
    );
    renderPage();
    const link = await screen.findByRole('link', { name: /ver productos de orishas/i });
    expect(link).toHaveAttribute('href', '/catalog?category=orishas');
  });

  it('muestra estado vacio cuando no hay categorias', async () => {
    server.use(
      http.get(`${BASE}/api/v2/categories/`, () =>
        HttpResponse.json({ results: [], count: 0 }),
      ),
    );
    renderPage();
    expect(
      await screen.findByText(/no hay categorias disponibles/i),
    ).toBeInTheDocument();
  });

  it('muestra estado de error si la API falla', async () => {
    server.use(
      http.get(`${BASE}/api/v2/categories/`, () =>
        HttpResponse.json({ detail: 'Error' }, { status: 400 }),
      ),
    );
    renderPage();
    expect(
      await screen.findByText(/no se pudo cargar el arbol de categorias/i),
    ).toBeInTheDocument();
  });
});
