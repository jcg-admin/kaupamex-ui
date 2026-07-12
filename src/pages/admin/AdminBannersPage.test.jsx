/**
 * Tests AdminBannersPage — UC-CFG-06 / G-CFG-01.
 *
 * Verifica que la página consume /api/v2/admin/banners/ y presenta los
 * banners como galería agrupada por placement (no tabla), con FileUpload
 * para la imagen.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import AdminBannersPage from './AdminBannersPage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const BANNERS = [
  { id: 1, image_url: 'http://x/h1.png', placement: 'HERO', title: '', alt_text: 'Hero uno', link_url: '', is_active: true, order: 0 },
  { id: 2, image_url: 'http://x/h2.png', placement: 'HERO', title: '', alt_text: 'Hero dos', link_url: '', is_active: false, order: 1 },
  { id: 3, image_url: 'http://x/p1.png', placement: 'PROMO_STRIP', title: '', alt_text: 'Franja', link_url: '', is_active: true, order: 0 },
];

function wrap(banners = BANNERS) {
  server.use(
    http.get(`${BASE}/api/v2/admin/banners/`, () => HttpResponse.json(banners)),
  );
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminBannersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminBannersPage', () => {
  it('renderiza los banners como galería por placement', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText('Hero uno')).toBeInTheDocument());
    // Agrupados por placement (dos secciones con su título)
    expect(screen.getByRole('heading', { name: 'Hero de portada' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Franja promocional' })).toBeInTheDocument();
    // La galería HERO es una lista ordenable (no una tabla)
    expect(screen.getByLabelText(/Banners — Hero de portada/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('usa FileUpload para la imagen (input file por accept)', async () => {
    const { container } = wrap([]);
    await waitFor(() => expect(screen.getByText(/Nuevo banner/)).toBeInTheDocument());
    const fileInput = container.querySelector('input[type="file"][accept="image/*"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('muestra el conteo de banners en la cabecera', async () => {
    wrap();
    await waitFor(() => expect(screen.getByText(/3 banners/)).toBeInTheDocument());
  });
});
