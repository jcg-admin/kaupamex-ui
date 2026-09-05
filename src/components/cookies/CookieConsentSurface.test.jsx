/**
 * Tests — CookieConsentSurface (Kaupamex UI)
 *
 * El aviso de cookies (LFPDPPP) es del sitio público: se muestra en la tienda
 * pero NO en el backoffice ``/admin/*`` (antes aparecía a la mitad de la vista
 * del módulo admin). Verifica el gate por ruta.
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CookieConsentProvider } from '@context/CookieConsentContext';
import CookieConsentSurface from '@components/cookies/CookieConsentSurface';

function clearCookies() {
  document.cookie
    .split('; ')
    .filter(Boolean)
    .forEach((row) => {
      const name = row.split('=')[0];
      document.cookie = `${name}=; Max-Age=0; Path=/`;
    });
}

beforeEach(clearCookies);

function renderAt(pathname) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <CookieConsentProvider>
        <CookieConsentSurface />
      </CookieConsentProvider>
    </MemoryRouter>,
  );
}

describe('CookieConsentSurface', () => {
  it('muestra el aviso de cookies en la tienda pública', () => {
    renderAt('/');
    expect(
      screen.getByRole('region', { name: /consentimiento de cookies/i }),
    ).toBeInTheDocument();
  });

  it('oculta el aviso de cookies en el panel de administración', () => {
    renderAt('/admin/logs');
    expect(
      screen.queryByRole('region', { name: /consentimiento de cookies/i }),
    ).not.toBeInTheDocument();
  });

  it('oculta el aviso también en la raíz del admin (/admin)', () => {
    renderAt('/admin');
    expect(
      screen.queryByRole('region', { name: /consentimiento de cookies/i }),
    ).not.toBeInTheDocument();
  });
});
