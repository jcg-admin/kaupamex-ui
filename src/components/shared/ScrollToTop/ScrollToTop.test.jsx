/**
 * Tests — ScrollToTop
 *
 * Lleva el scroll al tope al cambiar de ruta, EXCEPTO en /catalog, que
 * gestiona su propio scroll (posiciona en los productos, no en el hero).
 */
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ScrollToTop from './ScrollToTop';

describe('ScrollToTop', () => {
  beforeEach(() => { window.scrollTo.mockClear(); });

  it('lleva el scroll al tope en una ruta normal', () => {
    render(
      <MemoryRouter initialEntries={['/catalog/collar-oshun']}>
        <ScrollToTop />
      </MemoryRouter>,
    );
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('NO fuerza el tope en /catalog (lo gestiona la pagina)', () => {
    render(
      <MemoryRouter initialEntries={['/catalog?orisha=elegua']}>
        <ScrollToTop />
      </MemoryRouter>,
    );
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
