/**
 * Tests — useBusEvents / useBusListener (T-078, DEC-AF-06).
 *
 * El bus **avisa**; el endpoint de estado sigue siendo la verdad (H-API-71).
 * Por eso lo que se verifica aquí es que el evento llega y dispara al oyente,
 * no que el evento sustituya a la consulta de estado.
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { useBusListener, __resetBusCursor } from './useBusEvents';

const BASE = process.env.API_URL || 'http://localhost:8000';

function wrap() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

beforeEach(() => __resetBusCursor());

test('entrega al oyente los eventos de su tipo', async () => {
  server.use(
    http.get(`${BASE}/api/v2/bus/poll/`, () =>
      HttpResponse.json({
        last: 7,
        notifications: [
          { id: 6, message: { type: 'notificacion', payload: { subject: 'Hola' } } },
          { id: 7, message: { type: 'pago.estado', payload: { status: 'APPROVED' } } },
        ],
      }),
    ),
  );
  const visto = [];
  renderHook(() => useBusListener('pago.estado', (p) => visto.push(p)), {
    wrapper: wrap(),
  });

  await waitFor(() => expect(visto).toHaveLength(1));
  expect(visto[0].status).toBe('APPROVED');
});

test('no entrega los eventos de otro tipo', async () => {
  server.use(
    http.get(`${BASE}/api/v2/bus/poll/`, () =>
      HttpResponse.json({
        last: 3,
        notifications: [
          { id: 3, message: { type: 'notificacion', payload: { subject: 'Hola' } } },
        ],
      }),
    ),
  );
  const visto = [];
  const otros = [];
  renderHook(() => {
    useBusListener('notificacion', (p) => otros.push(p));
    useBusListener('pago.estado', (p) => visto.push(p));
  }, { wrapper: wrap() });

  await waitFor(() => expect(otros).toHaveLength(1));
  expect(visto).toHaveLength(0);
});

test('avanza el cursor con el last de la respuesta', async () => {
  const pedidos = [];
  server.use(
    http.get(`${BASE}/api/v2/bus/poll/`, ({ request }) => {
      pedidos.push(new URL(request.url).searchParams.get('last'));
      return HttpResponse.json({
        last: 42,
        notifications: [
          { id: 42, message: { type: 'notificacion', payload: {} } },
        ],
      });
    }),
  );
  const { result } = renderHook(() => useBusListener('notificacion', () => {}), {
    wrapper: wrap(),
  });

  await waitFor(() => expect(result.current.last).toBe(42));
  // El primer sondeo arranca en 0 — la ventana reciente del servidor.
  expect(pedidos[0]).toBe('0');
});

test('deshabilitado no sondea', async () => {
  let llamadas = 0;
  server.use(
    http.get(`${BASE}/api/v2/bus/poll/`, () => {
      llamadas += 1;
      return HttpResponse.json({ last: 0, notifications: [] });
    }),
  );
  renderHook(() => useBusListener('notificacion', () => {}, { enabled: false }), {
    wrapper: wrap(),
  });

  await new Promise((r) => setTimeout(r, 50));
  expect(llamadas).toBe(0);
});

test('un evento ya entregado no se repite al re-renderizar', async () => {
  server.use(
    http.get(`${BASE}/api/v2/bus/poll/`, () =>
      HttpResponse.json({
        last: 9,
        notifications: [
          { id: 9, message: { type: 'notificacion', payload: { subject: 'Una vez' } } },
        ],
      }),
    ),
  );
  const visto = [];
  const { rerender } = renderHook(
    () => useBusListener('notificacion', (p) => visto.push(p)),
    { wrapper: wrap() },
  );

  await waitFor(() => expect(visto).toHaveLength(1));
  rerender();
  rerender();
  expect(visto).toHaveLength(1);
});
