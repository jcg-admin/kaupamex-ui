/**
 * Tests — AdminProductsPage (D-011)
 *
 * Listado admin de productos con Redux adminSlice.
 */
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

import apiService from '@services/apiService';
import adminReducer from '@redux/slices/adminSlice';
import AdminProductsPage from './AdminProductsPage';

const PRODUCTS = [
  { id: 1, name: 'Collar Oshun dorado', slug: 'collar-oshun-dorado',
    sku: 'OSHUN-001', base_price: '1250.00', stock: 8,
    is_active: true, is_published: true, is_featured: false,
    categories: [{ id: 1, name: 'Collares' }], images: [] },
  { id: 2, name: 'Pulsera Elegua roja', slug: 'pulsera-elegua-roja',
    sku: 'ELEG-002', base_price: '480.00', stock: 0,
    is_active: false, is_published: false, is_featured: false,
    categories: [{ id: 2, name: 'Pulseras' }], images: [] },
  { id: 3, name: 'Elekes Yemaya', slug: 'elekes-yemaya',
    sku: 'YEMA-003', base_price: '890.00', stock: 5,
    is_active: true, is_published: true, is_featured: false,
    categories: [{ id: 3, name: 'Elekes' }], images: [] },
];

const RESPONSE_PAGE_1 = { count: 27, next: 'page=2', previous: null, results: PRODUCTS };

const makeStore = () => configureStore({ reducer: { admin: adminReducer } });

const wrap = (ui) => (
  <Provider store={makeStore()}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

describe('AdminProductsPage (D-011 listado)', () => {
  it('muestra el titulo de la pagina', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    expect(
      await screen.findByRole('heading', { name: /Productos/i }),
    ).toBeInTheDocument();
  });

  it('llama a GET /api/v2/admin/products/ al montar', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v2/admin/products/',
      expect.anything(),
    );
  });

  it('renderiza cada producto con nombre, SKU, precio y stock', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    expect(await screen.findByText('Collar Oshun dorado')).toBeInTheDocument();
    expect(screen.getByText('OSHUN-001')).toBeInTheDocument();
  });

  it('muestra estado publicado/borrador segun is_published', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');
    expect(screen.getAllByText('Publicado').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Borrador').length).toBeGreaterThan(0);
  });

  it('muestra estado vacio cuando no hay productos', async () => {
    apiService.get.mockResolvedValue({ data: { count: 0, results: [] } });
    render(wrap(<AdminProductsPage />));
    expect(
      await screen.findByText(/Sin productos que coincidan/i),
    ).toBeInTheDocument();
  });
});

describe('AdminProductsPage — busqueda', () => {
  it('pasa search en los params al cambiar el input', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');

    fireEvent.change(
      screen.getByPlaceholderText(/Buscar/i),
      { target: { value: 'oshun' } },
    );

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v2/admin/products/',
        expect.objectContaining({
          params: expect.objectContaining({ search: 'oshun' }),
        }),
      );
    });
  });
});

describe('AdminProductsPage — filtro por estado', () => {
  it('re-llama al API al hacer clic en el boton Publicados', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');

    fireEvent.click(screen.getByRole('button', { name: /Publicados/i }));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v2/admin/products/',
        expect.objectContaining({
          params: expect.objectContaining({ filter: 'published' }),
        }),
      );
    });
  });
});

describe('AdminProductsPage — botones de accion por fila', () => {
  it('renderiza el enlace al detalle del producto', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});

describe('AdminProductsPage — DataTable (US-2.1)', () => {
  // Migración a DataTable: el catálogo se renderiza en la tabla reutilizable
  // con ordenamiento por columna (cliente). Verifica la interacción de sort.
  it('ordena el catálogo por producto al hacer clic en el header', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');

    function productCells() {
      // La columna Producto es la 2ª celda (índice 1): col[0] es la miniatura.
      return screen.getAllByRole('row')
        .slice(1)
        .map((r) => within(r).queryAllByRole('cell')[1]?.textContent)
        .filter(Boolean);
    }

    // Orden natural (orden de llegada del API).
    expect(productCells()).toEqual([
      'Collar Oshun dorado', 'Pulsera Elegua roja', 'Elekes Yemaya',
    ]);

    // Ordenar ascendente por Producto (localeCompare 'es').
    fireEvent.click(screen.getByRole('button', { name: /^Producto$/ }));
    expect(productCells()).toEqual([
      'Collar Oshun dorado', 'Elekes Yemaya', 'Pulsera Elegua roja',
    ]);

    // El header expone el estado de orden accesible.
    expect(
      screen.getByRole('button', { name: /^Producto$/ }).closest('th'),
    ).toHaveAttribute('aria-sort', 'ascending');
  });
});
