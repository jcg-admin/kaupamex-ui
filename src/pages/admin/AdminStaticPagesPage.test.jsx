/**
 * Tests AdminStaticPagesPage — UC-CFG-04.
 *
 * Verifica que la página consume /api/v2/admin/pages/, lista las páginas
 * canónicas, carga el detalle en el editor y publica vía
 * POST /api/v2/admin/pages/<slug>/publish/.
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import AdminStaticPagesPage from './AdminStaticPagesPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const PAGES = [
  {
    id: 1, slug: 'about', slug_display: 'Acerca de nosotros', title: 'Acerca de nosotros',
    current_version: { id: 9, version: 3, content: '<p>Somos Yoruba</p>', status: 'PUBLISHED' },
    updated_at: '2026-07-12T00:00:00Z',
  },
  {
    id: 2, slug: 'faq', slug_display: 'Preguntas frecuentes', title: 'Preguntas frecuentes',
    current_version: null, updated_at: '2026-07-12T00:00:00Z',
  },
];

function wrap(pages = PAGES) {
  server.use(
    http.get(`${BASE}/api/v2/admin/pages/`, () => HttpResponse.json(pages)),
    http.get(`${BASE}/api/v2/admin/pages/:slug/`, ({ params }) =>
      HttpResponse.json(pages.find((p) => p.slug === params.slug) ?? pages[0])),
    http.post(`${BASE}/api/v2/admin/pages/:slug/publish/`, () =>
      HttpResponse.json({ id: 10, version: 4, status: 'PUBLISHED', content: 'x' }, { status: 201 })),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminStaticPagesPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminStaticPagesPage', () => {
  it('lista las páginas de contenido consumiendo el endpoint admin', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('Acerca de nosotros')).toBeInTheDocument());
    expect(screen.getByText('Preguntas frecuentes')).toBeInTheDocument();
    // No es una tabla — es un master/detalle con lista de navegación.
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('al elegir una página carga su contenido en el editor', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('Acerca de nosotros')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Acerca de nosotros/ }));
    await waitFor(() =>
      expect(screen.getByLabelText('Contenido de la página')).toBeInTheDocument());
    expect(screen.getByText(/Versión activa: v3/)).toBeInTheDocument();
  });

  it('publica una nueva versión y muestra la confirmación', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('Acerca de nosotros')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Acerca de nosotros/ }));
    await waitFor(() =>
      expect(screen.getByLabelText('Contenido de la página')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() =>
      expect(screen.getByText(/Publicada la versión 4/)).toBeInTheDocument());
  });
});
