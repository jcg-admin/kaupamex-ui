/**
 * Tests — NotFoundPage
 *
 * Verifica que los CTAs de la pagina 404 apunten a rutas validas
 * y no creen bucles de redireccion (link a "/" decia "Ir al catalogo"
 * pero llevaba al home, no al catalogo).
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@components/common/primitives', () => ({
  __esModule: true,
  MetaTag: ({ children }) => <span>{children}</span>,
  Button:  ({ children }) => <button type="button">{children}</button>,
}));

import NotFoundPage from './NotFoundPage';

function renderPage() {
  return render(
    <MemoryRouter>
      <NotFoundPage />
    </MemoryRouter>,
  );
}

describe('NotFoundPage', () => {
  it('muestra el codigo 404 y el titulo', () => {
    renderPage();
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /esta página/i })).toBeInTheDocument();
  });

  it('CTA "Ir al catalogo" apunta a /catalog (no a /)', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /ir al cat[aá]logo/i });
    expect(link).toHaveAttribute('href', '/catalog');
  });

  it('CTA "Buscar por orisha" apunta a /catalog?cat=por-orisha', () => {
    renderPage();
    const link = screen.getByRole('link', { name: /buscar por/i });
    expect(link).toHaveAttribute('href', '/catalog?cat=por-orisha');
  });
});
