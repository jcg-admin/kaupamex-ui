/**
 * Tests — Footer (T-04).
 *
 * El link "Ingresar" del footer debe llevar la pagina actual como
 * ``state.from`` para que el login regrese a ella (antes era un Link plano
 * y siempre caia a /account).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import catalogReducer from '../../../redux/slices/catalogSlice';
import { CookieConsentProvider } from '@context/CookieConsentContext';
import Footer from './index';

function LocationProbe() {
  const loc = useLocation();
  return <div data-testid="from">{loc.state?.from?.pathname ?? 'none'}</div>;
}

const makeStore = () =>
  configureStore({ reducer: { catalog: catalogReducer } });

const renderAt = (path) =>
  render(
    <Provider store={makeStore()}>
      <CookieConsentProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={path} element={<Footer />} />
            <Route path="/auth/login" element={<LocationProbe />} />
          </Routes>
        </MemoryRouter>
      </CookieConsentProvider>
    </Provider>,
  );

describe('Footer (T-04)', () => {
  it('el link "Ingresar" lleva la pagina actual como state.from', () => {
    renderAt('/catalog');
    fireEvent.click(screen.getByRole('link', { name: /ingresar/i }));
    expect(screen.getByTestId('from')).toHaveTextContent('/catalog');
  });
});
