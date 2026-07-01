/**
 * SearchModal — navegación por teclado de resultados (Fase 9).
 * Verifica el patrón listbox: ↑/↓ mueven el resaltado (aria-selected /
 * aria-activedescendant) y Enter abre el resultado resaltado.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, useLocation } from 'react-router-dom';

import uiReducer from '@redux/slices/uiSlice';
import SearchModal from './SearchModal';

// Resultados deterministas: se evita react-query/MSW mockeando el hook.
const MOCK = [
  { id: 1, name: 'Eleke de Shango', slug: 'eleke-shango', price: 100 },
  { id: 2, name: 'Otá de Yemayá', slug: 'ota-yemaya', price: 200 },
  { id: 3, name: 'Iruke', slug: 'iruke', price: 300 },
];

jest.mock('@hooks/domain/useSearch', () => ({
  __esModule: true,
  useSearch: () => ({ data: { results: MOCK }, isFetching: false }),
  isQueryValid: () => true,
  default: () => ({ data: { results: MOCK }, isFetching: false }),
}));

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="loc">{loc.pathname}</div>;
}

function renderModal() {
  const store = configureStore({
    reducer: { ui: uiReducer },
    preloadedState: { ui: { isSearchOpen: true, toasts: [] } },
  });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/']}>
        <SearchModal />
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  );
}

describe('SearchModal — navegación por teclado', () => {
  const getInput = () => screen.getByLabelText('Término de búsqueda');

  it('ArrowDown resalta el primer resultado y avanza', () => {
    renderModal();
    const input = getInput();
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-0');
    expect(screen.getByText('Eleke de Shango').closest('[role="option"]'))
      .toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-1');
  });

  it('ArrowUp desde el primero envuelve al último', () => {
    renderModal();
    const input = getInput();
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // idx 0
    fireEvent.keyDown(input, { key: 'ArrowUp' });   // envuelve a idx 2
    expect(input).toHaveAttribute('aria-activedescendant', 'search-option-2');
  });

  it('Enter sobre el resaltado navega a ese producto', () => {
    renderModal();
    const input = getInput();
    fireEvent.keyDown(input, { key: 'ArrowDown' }); // idx 0 → eleke-shango
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('loc')).toHaveTextContent('/catalog/eleke-shango');
  });

  it('Enter sin resaltado no navega a un producto (deja el término)', () => {
    renderModal();
    const input = getInput();
    // Sin ArrowDown previo: activeIndex = -1, Enter no dispara navegación a catálogo.
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByTestId('loc')).not.toHaveTextContent('/catalog/');
  });
});
