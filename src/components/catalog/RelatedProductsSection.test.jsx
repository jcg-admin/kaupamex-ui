/**
 * Tests — RelatedProductsSection (UC-CAT-07).
 *
 * RelatedProductsSection renders ProductCard components which use Redux
 * (useDispatch, useSelector for auth and wishlist).
 * A Redux Provider is required.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(), post: jest.fn(),
    patch: jest.fn(), delete: jest.fn(),
  },
}));

import apiService from '@services/apiService';
import cartReducer from '@redux/slices/cartSlice';
import RelatedProductsSection from './RelatedProductsSection';

const makeStore = () =>
  configureStore({
    reducer: {
      cart: cartReducer,
      auth: (state = { isAuthenticated: false }) => state,
    },
  });

const P1 = {
  id: 11, name: 'Pulsera Yemaya', slug: 'pulsera-yemaya',
  sku: 'PUY-001', base_price: 200, price_with_tax: 232, stock: 5,
  category_name: 'Pulseras', highlighted_name: 'Pulsera Yemaya',
};
const P2 = {
  id: 12, name: 'Collar Oshun', slug: 'collar-oshun',
  sku: 'COO-001', base_price: 300, price_with_tax: 348, stock: 1,
  category_name: 'Collares', highlighted_name: 'Collar Oshun',
};

const renderSection = (slug = 'producto-base') => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Provider store={makeStore()}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <RelatedProductsSection slug={slug} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

afterEach(() => jest.clearAllMocks());

describe('RelatedProductsSection (UC-CAT-07)', () => {
  it('llama a GET /api/v2/products/:slug/related/', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], fallback: null } });
    renderSection('mi-producto');
    await waitFor(() =>
      expect(apiService.get).toHaveBeenCalledWith(
        '/api/v2/products/mi-producto/related/',
        expect.any(Object),
      ),
    );
  });

  it('renderiza productos relacionados con titulo "Productos relacionados"', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [P1, P2], fallback: 'category' },
    });
    renderSection();
    expect(await screen.findByText('Pulsera Yemaya')).toBeInTheDocument();
    expect(screen.getByText('Collar Oshun')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /^productos relacionados$/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it('usa titulo "Tambien te puede interesar" cuando fallback es recent', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [P1], fallback: 'recent' },
    });
    renderSection();
    expect(
      await screen.findByRole('heading', { name: /tambien te puede interesar/i }),
    ).toBeInTheDocument();
  });

  it('oculta la seccion cuando no hay resultados (Alt A)', async () => {
    apiService.get.mockResolvedValue({ data: { results: [], fallback: 'category' } });
    const { container } = renderSection();
    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });

  it('oculta la seccion silenciosamente cuando la API falla (EX-01/EX-02)', async () => {
    apiService.get.mockRejectedValue(new Error('boom'));
    const { container } = renderSection();
    await waitFor(() => expect(apiService.get).toHaveBeenCalled());
    await waitFor(() => expect(container.querySelector('section')).toBeNull());
  });
});
