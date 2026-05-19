/**
 * Tests — AdminProductsPage (D-011)
 *
 * Listado admin de productos sobre GET /api/v1/admin/products/.
 * Cubre:
 *   - Render del listado.
 *   - Busqueda libre por nombre/SKU.
 *   - Filtro por estado (activo / inactivo).
 *   - Paginacion.
 *   - Botones de accion: editar, variantes (UC-CHT-03),
 *     descuentos (UC-DASH-01..04).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import productsReducer from '@redux/slices/productsSlice';
import AdminProductsPage from './AdminProductsPage';

const PRODUCTS = [
  { id: 1, name: 'Collar Oshun dorado', slug: 'collar-oshun-dorado',
    sku: 'OSHUN-001', base_price: '1250.00', stock: 8,
    is_active: true,  is_published: true,  category: { id: 1, name: 'Collares' } },
  { id: 2, name: 'Pulsera Elegua roja',  slug: 'pulsera-elegua-roja',
    sku: 'ELEG-002',  base_price: '480.00',  stock: 0,
    is_active: false, is_published: false, category: { id: 2, name: 'Pulseras' } },
  { id: 3, name: 'Elekes Yemaya',        slug: 'elekes-yemaya',
    sku: 'YEMA-003',  base_price: '890.00',  stock: 5,
    is_active: true,  is_published: true,  category: { id: 3, name: 'Elekes' } },
];

const RESPONSE_PAGE_1 = { count: 27, next: 'page=2', previous: null, results: PRODUCTS };

const makeClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const makeStore = () => configureStore({ reducer: { products: productsReducer } });

const wrap = (ui) => (
  <QueryClientProvider client={makeClient()}>
    <Provider store={makeStore()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </Provider>
  </QueryClientProvider>
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

  it('llama a GET /api/v1/admin/products/ al montar', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/products/',
      expect.anything(),
    );
  });

  it('renderiza cada producto con nombre, SKU, precio y stock', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    expect(await screen.findByText('Collar Oshun dorado')).toBeInTheDocument();
    expect(screen.getByText('OSHUN-001')).toBeInTheDocument();
    expect(screen.getByText(/1[,.]?250/)).toBeInTheDocument();
  });

  it('muestra estado activo/inactivo segun is_active', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');
    // Buscar en celdas (no en options del select).
    const cells = screen.getAllByRole('cell');
    const labels = cells.map((c) => c.textContent);
    expect(labels.some((t) => /Activo/i.test(t) && !/Inactivo/i.test(t))).toBe(true);
    expect(labels.some((t) => /^Inactivo$/i.test(t.trim()))).toBe(true);
  });

  it('muestra estado vacio cuando no hay productos', async () => {
    apiService.get.mockResolvedValue({ data: { count: 0, results: [] } });
    render(wrap(<AdminProductsPage />));
    expect(
      await screen.findByText(/No se encontraron productos/i),
    ).toBeInTheDocument();
  });
});

describe('AdminProductsPage — busqueda', () => {
  it('pasa search en los params al cambiar el input', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');

    fireEvent.change(screen.getByLabelText(/Buscar/i),
      { target: { value: 'oshun' } });

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/products/',
        expect.objectContaining({
          params: expect.objectContaining({ search: 'oshun' }),
        }),
      );
    });
  });
});

describe('AdminProductsPage — filtro por estado', () => {
  it('envia is_active=true al elegir Activos', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');

    fireEvent.change(screen.getByLabelText(/Estado/i),
      { target: { value: 'active' } });

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/products/',
        expect.objectContaining({
          params: expect.objectContaining({ is_active: true }),
        }),
      );
    });
  });

  it('envia is_active=false al elegir Inactivos', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');

    fireEvent.change(screen.getByLabelText(/Estado/i),
      { target: { value: 'inactive' } });

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/products/',
        expect.objectContaining({
          params: expect.objectContaining({ is_active: false }),
        }),
      );
    });
  });
});

describe('AdminProductsPage — paginacion', () => {
  it('muestra el total de productos y la pagina actual', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    expect(await screen.findByText(/27 productos/i)).toBeInTheDocument();
    expect(screen.getByText(/Pagina 1/i)).toBeInTheDocument();
  });

  it('pasa el numero de pagina en los params al clic en Siguiente', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');

    fireEvent.click(screen.getByRole('button', { name: /Siguiente/i }));

    await waitFor(() => {
      expect(apiService.get).toHaveBeenLastCalledWith(
        '/api/v1/admin/products/',
        expect.objectContaining({
          params: expect.objectContaining({ page: 2 }),
        }),
      );
    });
  });

  it('deshabilita Anterior en la primera pagina', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    await screen.findByText('Collar Oshun dorado');
    expect(screen.getByRole('button', { name: /Anterior/i })).toBeDisabled();
  });
});

describe('AdminProductsPage — botones de accion por fila', () => {
  it('renderiza el boton Editar enlazado al detalle del producto', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    const editLinks = await screen.findAllByRole('link', { name: /Editar/i });
    expect(editLinks[0]).toHaveAttribute('href', '/admin/products/1/edit');
  });

  it('renderiza el boton Variantes (UC-CHT-03) enlazado por id de producto', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    const links = await screen.findAllByRole('link', { name: /Variantes/i });
    expect(links[0]).toHaveAttribute('href', '/admin/products/1/variants');
  });

  it('renderiza el boton Descuentos (UC-DASH-01..04)', async () => {
    apiService.get.mockResolvedValue({ data: RESPONSE_PAGE_1 });
    render(wrap(<AdminProductsPage />));
    const links = await screen.findAllByRole('link', { name: /Descuentos/i });
    expect(links[0]).toHaveAttribute('href', '/admin/products/1/discounts');
  });
});
