/**
 * Tests HomePage — landing publico.
 *
 * Verifica:
 *   - se renderiza sin sesion (anonimo)
 *   - hero con CTA "Ver catalogo" enlaza a /catalog
 *   - listado de categorias destacadas con links a /catalog?cat=
 *   - grid de productos destacados se llena cuando catalogSlice tiene items
 */
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: { results: [] } }) },
}));

import catalogReducer from '@redux/slices/catalogSlice';
import authReducer from '@redux/slices/authSlice';
import HomePage from './HomePage';

function makeStore(products = []) {
  return configureStore({
    reducer: { catalog: catalogReducer, auth: authReducer },
    preloadedState: {
      catalog: {
        products,
        currentProduct: null,
        categories: [],
        filters: {},
        searchResults: [],
        searchQuery: '',
        isLoading: false,
        isSearching: false,
        error: null,
        searchError: null,
        pagination: { page: 1, total: 0 },
      },
    },
  });
}

function renderHome(products = []) {
  return render(
    <Provider store={makeStore(products)}>
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    </Provider>,
  );
}

describe('HomePage — landing anonima', () => {
  it('renderiza el hero con el titulo principal', () => {
    renderHome();
    expect(screen.getByRole('heading', { name: /practica yoruba/i, level: 1 }))
      .toBeInTheDocument();
  });

  it('expone CTA al catalogo y al registro', () => {
    renderHome();
    expect(screen.getByRole('link', { name: /ver catalogo/i }))
      .toHaveAttribute('href', '/catalog');
    expect(screen.getByRole('link', { name: /crear cuenta/i }))
      .toHaveAttribute('href', '/auth/register');
  });

  it('lista categorias destacadas con links a /catalog?cat=', () => {
    renderHome();
    const collares = screen.getByRole('link', { name: /collares/i });
    expect(collares).toHaveAttribute('href', '/catalog?cat=collares');
  });

  it('pinta productos destacados cuando el slice tiene items', () => {
    const PRODUCTS = [
      { id: 1, slug: 'collar-1', name: 'Collar 1', base_price: 100, price_with_tax: 116, stock: 5 },
      { id: 2, slug: 'pulsera-2', name: 'Pulsera 2', base_price: 50, price_with_tax: 58, stock: 0 },
    ];
    renderHome(PRODUCTS);
    expect(screen.getByTestId('home-featured-grid')).toBeInTheDocument();
    expect(screen.getByText(/collar 1/i)).toBeInTheDocument();
    expect(screen.getByText(/pulsera 2/i)).toBeInTheDocument();
  });
});
