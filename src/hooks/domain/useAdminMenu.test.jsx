/**
 * Tests — useAdminMenu (menú admin dinámico por capacidades, DEC-08/09).
 * Verifica: adopta el árbol del servidor cuando responde 200 (incl. nivel 2);
 * degrada al fallback estático cuando el endpoint falla (401 base handler).
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import useAdminMenu from './useAdminMenu';

const BASE = process.env.API_URL || 'http://localhost:8000';

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

const FALLBACK = [
  { section: 'Principal', items: [{ to: '/admin', label: 'Dashboard' }] },
];

test('adopta el árbol dinámico del servidor (incl. nivel 2)', async () => {
  server.use(
    http.get(`${BASE}/api/v2/authz/me/menu/`, () =>
      HttpResponse.json([
        { key: 'sec-ops', label: 'Operaciones', route: '', children: [
          { key: 'grp-rep', label: 'Reportes', route: '', children: [
            { key: 'r-ventas', label: 'Ventas', route: '/admin/reports/sales', children: [] },
          ] },
        ] },
      ]),
    ),
  );
  const { result } = renderHook(() => useAdminMenu(FALLBACK), { wrapper: wrap() });
  await waitFor(() => expect(result.current.isDynamic).toBe(true));
  expect(result.current.nav[0].label).toBe('Operaciones');
  // Nivel 2: Operaciones → Reportes → Ventas.
  const grupo = result.current.nav[0].children[0];
  expect(grupo.label).toBe('Reportes');
  expect(grupo.children[0].route).toBe('/admin/reports/sales');
});

test('degrada al fallback estático cuando el endpoint falla', async () => {
  // El handler base de authz responde 401 → useAdminMenu usa el fallback.
  const { result } = renderHook(() => useAdminMenu(FALLBACK), { wrapper: wrap() });
  await waitFor(() => expect(result.current.nav.length).toBeGreaterThan(0));
  expect(result.current.isDynamic).toBe(false);
  // El fallback estático se normaliza a la forma de árbol.
  expect(result.current.nav[0].label).toBe('Principal');
  expect(result.current.nav[0].children[0].route).toBe('/admin');
});

test('menú vacío ([]) es un resultado válido (usuario sin capacidades)', async () => {
  server.use(
    http.get(`${BASE}/api/v2/authz/me/menu/`, () => HttpResponse.json([])),
  );
  const { result } = renderHook(() => useAdminMenu(FALLBACK), { wrapper: wrap() });
  await waitFor(() => expect(result.current.isDynamic).toBe(true));
  expect(result.current.nav).toEqual([]);
});
