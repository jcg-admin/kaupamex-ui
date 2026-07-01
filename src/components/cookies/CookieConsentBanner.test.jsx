/**
 * Tests — CookieConsentBanner (PracticaYoruba UI)
 *
 * Verifican la Capa 1: el banner aparece cuando falta consentimiento, ofrece
 * Aceptar/Rechazar con igual prominencia y enlace al aviso, y que cada accion
 * persiste el registro de consentimiento (LFPDPPP).
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { CookieConsentProvider } from '@context/CookieConsentContext';
import { readConsent } from '@lib/cookieConsent';

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

function renderBanner() {
  return render(
    <CookieConsentProvider>
      <div>contenido</div>
    </CookieConsentProvider>,
  );
}

describe('CookieConsentBanner', () => {
  it('muestra el banner cuando no hay consentimiento', () => {
    renderBanner();
    expect(screen.getByRole('region', { name: /consentimiento de cookies/i }))
      .toBeInTheDocument();
    expect(screen.getByRole('button', { name: /aceptar todo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rechazar todo/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /aviso de privacidad/i }))
      .toHaveAttribute('href', '/info/privacidad');
  });

  it('Aceptar todo persiste todas las categorias', () => {
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /aceptar todo/i }));
    const record = readConsent();
    expect(record.choices).toEqual({
      necessary: true, functional: true, analytics: true, marketing: true,
    });
  });

  it('Rechazar todo persiste solo las necesarias', () => {
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /rechazar todo/i }));
    const record = readConsent();
    expect(record.choices).toEqual({
      necessary: true, functional: false, analytics: false, marketing: false,
    });
  });
});
