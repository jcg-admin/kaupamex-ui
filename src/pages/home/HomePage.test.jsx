/**
 * Tests HomePage — landing publico.
 *
 * These tests match the actual HomePage component behavior:
 *   - Hero title is "Para los que practican." (not "practica yoruba")
 *   - CTA links go to /catalog (not /catalog)
 *   - Orisha links go to /catalog?orisha=<slug> (not /catalog?cat=)
 *   - Featured products come from state.catalog.featured (not state.catalog.products)
 *   - No data-testid="home-featured-grid" on the grid element
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import catalogReducer from '@redux/slices/catalogSlice';
import authReducer from '@redux/slices/authSlice';
import HomePage from './HomePage';

const BASE = process.env.API_URL || 'http://localhost:8000';

function makeStore(featured = []) {
  return configureStore({
    reducer: { catalog: catalogReducer, auth: authReducer },
    preloadedState: {
      catalog: {
        products: [],
        featured,
        currentProduct: null,
        categories: [],
        filters: {
          category: null,
          priceMin: null,
          priceMax: null,
          inStock: false,
          ordering: '-created_at',
        },
        searchResults: [],
        searchQuery: '',
        isLoading: false,
        isSearching: false,
        error: null,
        searchError: null,
        categoriesError: null,
        pagination: { page: 1, count: 0, pageSize: 20, totalPages: 0, next: null, previous: null },
        activeFilters: {},
      },
    },
  });
}

function renderHome(featured = []) {
  server.use(
    http.get(`${BASE}/api/v1/catalogue/`, () =>
      HttpResponse.json({ results: featured, count: featured.length, next: null, previous: null }),
    ),
  );
  return render(
    <Provider store={makeStore(featured)}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('HomePage — landing anonima', () => {
  it('renderiza el hero con el titulo principal', () => {
    renderHome();
    // Hero title is "Para los que practican." (not "practica yoruba")
    expect(screen.getByRole('heading', { level: 1 }))
      .toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 }).textContent)
      .toMatch(/practican/i);
  });

  it('expone CTA al catalogo', () => {
    renderHome();
    // Links go to /catalog (not /catalog)
    const catalogLink = screen.getByRole('link', { name: /Entrar al catálogo/i });
    expect(catalogLink).toHaveAttribute('href', '/catalog');
  });

  it('lista orishas con links a /catalog?orisha=', () => {
    renderHome();
    // HomePage has ORISHAS links to /catalog?orisha=<slug>
    const yemayaLink = screen.getByRole('link', { name: /Yemayá/i });
    expect(yemayaLink).toHaveAttribute('href', '/catalog?orisha=yemaya');
  });

  it('pinta productos destacados cuando el slice tiene featured items', async () => {
    const FEATURED = [
      { id: 1, slug: 'collar-1', name: 'Collar 1', base_price: 100, price_with_tax: 116, stock: 5, highlighted_name: 'Collar 1' },
      { id: 2, slug: 'pulsera-2', name: 'Pulsera 2', base_price: 50, price_with_tax: 58, stock: 0, highlighted_name: 'Pulsera 2' },
    ];
    renderHome(FEATURED);
    // ProductCard renders names via dangerouslySetInnerHTML from highlighted_name
    expect(await screen.findByText(/Collar 1/i)).toBeInTheDocument();
    expect(screen.getByText(/Pulsera 2/i)).toBeInTheDocument();
  });
});
