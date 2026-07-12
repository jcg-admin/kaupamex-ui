/**
 * Tests InfoPage — contenido informativo /info/:slug (UC-CFG-04, H-UI-CFG04-01).
 *
 * Dos capas: API pública (para páginas editables por el admin) con fallback a
 * content.js (para páginas sin contraparte editable o sin versión publicada).
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import InfoPage from './InfoPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

function wrap(slug) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/info/${slug}`]}>
        <Routes>
          <Route path="/info/:slug" element={<InfoPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('InfoPage', () => {
  it('renderiza el HTML publicado por el admin para una página editable', async () => {
    server.use(
      http.get(`${BASE}/api/v2/config/pages/faq`, () =>
        HttpResponse.json({
          slug: 'faq', title: 'Preguntas frecuentes',
          content: '<p>Respuesta editada por el admin</p>', updated_at: '2026-07-12',
        })),
    );
    wrap('faq');
    await waitFor(() =>
      expect(screen.getByText('Respuesta editada por el admin')).toBeInTheDocument());
    expect(screen.getByRole('heading', { level: 1, name: 'Preguntas frecuentes' }))
      .toBeInTheDocument();
  });

  it('cae al contenido local cuando el API no tiene versión publicada (404)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/config/pages/faq`, () =>
        HttpResponse.json({ detail: 'Página sin versión publicada.' }, { status: 404 })),
    );
    wrap('faq');
    // El fallback local (content.js) mantiene el título de la página.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
    // No revienta: se renderiza la página informativa local.
    expect(screen.getByText(/Volver al inicio/)).toBeInTheDocument();
  });

  it('no consulta el API para páginas sin contraparte editable (glosario)', async () => {
    // Sin handler para /pages/… : si InfoPage consultara, msw devolvería error.
    // 'glosario' no está en API_SLUG, así que sólo usa content.js.
    wrap('glosario');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument());
  });
});
