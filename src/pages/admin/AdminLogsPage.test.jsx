/**
 * Tests — AdminLogsPage (UC-ADM-06, SOL-011 T-09)
 *
 *   GET /api/v2/admin/logs/
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

const BASE = process.env.API_URL || 'http://localhost:8000';

import AdminLogsPage from './AdminLogsPage';

const REQUESTLOGS = [
  { id: 2, correlation_id: 'c2', method: 'POST', path: '/b', status_code: 500,
    duration_ms: 9, user_id: 7, created_at: '2026-07-10T13:00:00Z' },
  { id: 1, correlation_id: 'c1', method: 'GET', path: '/a', status_code: 200,
    duration_ms: 5, user_id: null, created_at: '2026-07-10T12:00:00Z' },
];

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <AdminLogsPage />
    </QueryClientProvider>
  );
};

describe('AdminLogsPage (UC-ADM-06)', () => {
  it('muestra el titulo de la pagina', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/logs/`, () =>
        HttpResponse.json({ source: 'requestlog', count: 2, page: 1, pages: 1, results: REQUESTLOGS }),
      ),
    );
    render(wrap());
    expect(await screen.findByRole('heading', { name: /Logs técnicos/i })).toBeInTheDocument();
  });

  it('llama al endpoint con source=requestlog por defecto', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/logs/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json({ source: 'requestlog', count: 2, page: 1, pages: 1, results: REQUESTLOGS });
      }),
    );
    render(wrap());
    await waitFor(() => {
      expect(lastUrl?.searchParams.get('source')).toBe('requestlog');
      expect(lastUrl?.searchParams.get('page')).toBe('1');
    });
  });

  it('lista los request logs', async () => {
    server.use(
      http.get(`${BASE}/api/v2/admin/logs/`, () =>
        HttpResponse.json({ source: 'requestlog', count: 2, page: 1, pages: 1, results: REQUESTLOGS }),
      ),
    );
    render(wrap());
    expect(await screen.findByText('/b')).toBeInTheDocument();
    expect(screen.getByText('/a')).toBeInTheDocument();
  });

  it('cambia a source=applog al pulsar la pestaña Aplicación', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/logs/`, ({ request }) => {
        lastUrl = new URL(request.url);
        const source = new URL(request.url).searchParams.get('source');
        return HttpResponse.json({ source, count: 0, page: 1, pages: 1, results: [] });
      }),
    );
    render(wrap());
    await screen.findByRole('tab', { name: /Aplicación/i });
    fireEvent.click(screen.getByRole('tab', { name: /Aplicación/i }));
    await waitFor(() => {
      expect(lastUrl?.searchParams.get('source')).toBe('applog');
    });
  });

  it('aplica el filtro status_min al enviar el formulario', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/logs/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json({ source: 'requestlog', count: 2, page: 1, pages: 1, results: REQUESTLOGS });
      }),
    );
    render(wrap());
    await screen.findByText('/b');
    fireEvent.change(screen.getByLabelText('Status ≥'), { target: { value: '400' } });
    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));
    await waitFor(() => {
      expect(lastUrl?.searchParams.get('status_min')).toBe('400');
    });
  });

  const withCapture = () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/logs/`, ({ request }) => {
        lastUrl = new URL(request.url);
        return HttpResponse.json({ source: 'requestlog', count: 60, page: 1, pages: 3, results: REQUESTLOGS });
      }),
    );
    return () => lastUrl;
  };

  it('envia page_size=25 por defecto', async () => {
    const getUrl = withCapture();
    render(wrap());
    await waitFor(() => expect(getUrl()?.searchParams.get('page_size')).toBe('25'));
  });

  it('aplica status exacto, ruta y rango de fechas', async () => {
    const getUrl = withCapture();
    render(wrap());
    await screen.findByText('/b');
    fireEvent.change(screen.getByLabelText('Status =='), { target: { value: '404' } });
    fireEvent.change(screen.getByLabelText('Ruta contiene'), { target: { value: '/api/v2' } });
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-07-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-07-10' } });
    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));
    await waitFor(() => {
      const u = getUrl();
      expect(u?.searchParams.get('status')).toBe('404');
      expect(u?.searchParams.get('path')).toBe('/api/v2');
      expect(u?.searchParams.get('from')).toBe('2026-07-01T00:00:00');
      expect(u?.searchParams.get('to')).toBe('2026-07-10T23:59:59');
    });
  });

  it('aplica el filtro correlation_id', async () => {
    const getUrl = withCapture();
    render(wrap());
    await screen.findByText('/b');
    fireEvent.change(screen.getByLabelText('Correlation ID'), { target: { value: 'abc123' } });
    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));
    await waitFor(() => expect(getUrl()?.searchParams.get('correlation_id')).toBe('abc123'));
  });

  it('el paginador de la DataTable avanza de página (server-side)', async () => {
    const getUrl = withCapture();
    render(wrap());
    await screen.findByText('/b');
    fireEvent.click(screen.getByRole('button', { name: /Página siguiente/i }));
    await waitFor(() => expect(getUrl()?.searchParams.get('page')).toBe('2'));
  });

  it('cambiar el tamaño de página envia page_size y resetea a page=1', async () => {
    const getUrl = withCapture();
    render(wrap());
    await screen.findByText('/b');
    fireEvent.change(screen.getByLabelText('Filas por página'), { target: { value: '100' } });
    await waitFor(() => {
      const u = getUrl();
      expect(u?.searchParams.get('page_size')).toBe('100');
      expect(u?.searchParams.get('page')).toBe('1');
    });
  });

  it('aplica el filtro level en la pestaña Aplicación', async () => {
    let lastUrl;
    server.use(
      http.get(`${BASE}/api/v2/admin/logs/`, ({ request }) => {
        lastUrl = new URL(request.url);
        const source = new URL(request.url).searchParams.get('source');
        return HttpResponse.json({ source, count: 0, page: 1, pages: 1, results: [] });
      }),
    );
    render(wrap());
    fireEvent.click(await screen.findByRole('tab', { name: /Aplicación/i }));
    await screen.findByLabelText('Nivel');
    fireEvent.change(screen.getByLabelText('Nivel'), { target: { value: 'ERROR' } });
    fireEvent.click(screen.getByRole('button', { name: /Filtrar/i }));
    await waitFor(() => expect(lastUrl?.searchParams.get('level')).toBe('ERROR'));
  });
});
