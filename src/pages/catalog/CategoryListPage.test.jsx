/**
 * Tests — CategoryListPage (UC-CAT-08).
 *
 * Listado publico del arbol jerarquico de categorias. Read-only,
 * React Query contra GET /api/v1/categories/.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(),
    patch: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';
import CategoryListPage from './CategoryListPage';

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

afterEach(() => jest.clearAllMocks());

describe('CategoryListPage (UC-CAT-08)', () => {
  it('muestra heading «Categorias»', async () => {
    apiService.get.mockResolvedValue({ data: { results: TREE, count: TREE.length } });
    renderPage();
    expect(
      await screen.findByRole('heading', { name: /categorias/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('renderiza los nodos raiz con su conteo de productos', async () => {
    apiService.get.mockResolvedValue({ data: { results: TREE, count: TREE.length } });
    renderPage();
    expect(await screen.findByText('Orishas')).toBeInTheDocument();
    expect(screen.getByText('Soperas')).toBeInTheDocument();
    expect(screen.getByText(/12 productos/i)).toBeInTheDocument();
    expect(screen.getByText(/7 productos/i)).toBeInTheDocument();
  });

  it('expande subcategorias al pulsar el toggle del nodo padre', async () => {
    apiService.get.mockResolvedValue({ data: { results: TREE, count: TREE.length } });
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
    apiService.get.mockResolvedValue({ data: { results: TREE, count: TREE.length } });
    renderPage();
    const link = await screen.findByRole('link', { name: /ver productos de orishas/i });
    expect(link).toHaveAttribute('href', '/catalog?category=orishas');
  });

  it('muestra estado vacio cuando no hay categorias', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], count: 0 } });
    renderPage();
    expect(
      await screen.findByText(/no hay categorias disponibles/i),
    ).toBeInTheDocument();
  });

  it('muestra estado de error si la API falla', async () => {
    apiService.get.mockRejectedValue(new Error('boom'));
    renderPage();
    expect(
      await screen.findByText(/no se pudo cargar el arbol de categorias/i),
    ).toBeInTheDocument();
  });
});
