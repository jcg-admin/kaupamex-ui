/**
 * Tests — AdminConfigPage (Hub UC-CFG-*)
 *
 * El hub no consume endpoints; solo enlaza a las paginas que ya
 * implementan cada subdominio de configuracion (CFG-01..05).
 */
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import AdminConfigPage from './AdminConfigPage';

describe('AdminConfigPage (hub de configuracion)', () => {
  it('renderiza el titulo Configuracion', () => {
    render(
      <MemoryRouter>
        <AdminConfigPage />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole('heading', { name: /^Configuracion$/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it('expone enlaces a los cinco dominios de configuracion', () => {
    render(
      <MemoryRouter>
        <AdminConfigPage />
      </MemoryRouter>,
    );
    // UC-CFG-03 (SiteSettings) — implementado en /admin/system-settings
    expect(
      screen.getByRole('link', { name: /Configuracion del Sistema/i }),
    ).toHaveAttribute('href', '/admin/system-settings');
    // UC-CFG-05 — datos de contacto (mensajes del comprador)
    expect(
      screen.getByRole('link', { name: /Mensajes de contacto/i }),
    ).toHaveAttribute('href', '/admin/contact/messages');
    // UC-CFG-01 — gateways de pago (panel de reportes)
    expect(
      screen.getByRole('link', { name: /Gateways y pagos/i }),
    ).toHaveAttribute('href', '/admin/payments');
    // UC-CFG-04 — contenido estatico (ya implementado: enlaza a /admin/content)
    expect(
      screen.getByRole('link', { name: /Gestionar contenido estático/i }),
    ).toHaveAttribute('href', '/admin/content');
    // UC-CFG-02 — metodos y costos de envio (relacionado al panel logistico)
    expect(
      screen.getByRole('link', { name: /Métodos y costos de envío/i }),
    ).toHaveAttribute('href', '/admin/logistics');
  });

  it('ya no tiene dominios pendientes: todas las tarjetas enlazan', () => {
    render(
      <MemoryRouter>
        <AdminConfigPage />
      </MemoryRouter>,
    );
    // Tras cablear UC-CFG-04 a /admin/content, el hub no deja «Proximamente».
    expect(screen.queryByText(/Proximamente/i)).not.toBeInTheDocument();
  });
});
