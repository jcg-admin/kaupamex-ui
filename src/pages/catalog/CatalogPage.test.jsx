/**
 * Tests — CatalogPage
 * UC-CAT-01 / UC-CAT-03 / UC-CAT-03-EXT
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }    from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

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

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
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
