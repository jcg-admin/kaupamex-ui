/**
 * Tests — ReturnCreatePage
 * UC-RET-01: Solicitar devolucion (Comprador)
 *
 * H-17: la orden se elige de un selector con los pedidos ENTREGADOS del
 * usuario (no un campo libre). Sin pedidos elegibles, vacío honesto.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import returnsReducer from '@redux/slices/returnsSlice';
import ordersReducer  from '@redux/slices/ordersSlice';
import ReturnCreatePage from './ReturnCreatePage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const ELIGIBLE = [
  { order_number: 'ORD-100', status: 'DELIVERED', created_at: '2026-07-01T00:00:00Z' },
];

// Store con un pedido entregado elegible preseleccionable en el selector.
const makeStore = (orders = ELIGIBLE) =>
  configureStore({
    reducer: { returns: returnsReducer, orders: ordersReducer },
    preloadedState: { orders: { list: orders, isLoading: false } },
  });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

beforeEach(() => {
  // fetchOrders(DELIVERED) se dispara al montar; devolver los elegibles.
  server.use(
    http.get(`${BASE}/api/v2/orders/`, () =>
      HttpResponse.json({ results: ELIGIBLE, count: ELIGIBLE.length }),
    ),
  );
});

describe('ReturnCreatePage (UC-RET-01)', () => {
  it('muestra el titulo de la pagina', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Solicitar devoluci/i })
    ).toBeInTheDocument();
  });

  it('renderiza los campos obligatorios', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    expect(screen.getByLabelText(/Pedido a devolver/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripci/i)).toBeInTheDocument();
  });

  it('sin pedidos elegibles muestra un vacío honesto', async () => {
    // El fetch al montar tambien devuelve vacio -> no hay nada que devolver.
    server.use(
      http.get(`${BASE}/api/v2/orders/`, () =>
        HttpResponse.json({ results: [], count: 0 }),
      ),
    );
    render(wrap(<ReturnCreatePage />, makeStore([])));
    expect(await screen.findByTestId('return-empty')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Enviar solicitud/i })
    ).toBeNull();
  });

  it('muestra error si la descripcion tiene menos de 20 caracteres', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Pedido a devolver/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),   { target: { value: 'corto' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));
    expect(
      screen.getByText(/al menos 20 caracteres/i)
    ).toBeInTheDocument();
  });

  it('muestra error si la orden esta vacia', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'Descripcion mas que suficiente del problema' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));
    expect(screen.getByText(/La orden es obligatoria/i)).toBeInTheDocument();
  });

  it('envia la solicitud al backend cuando el formulario es valido', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v2/return-requests/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 50, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Pedido a devolver/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i),    { target: { value: 'DAMAGED_PRODUCT' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con daños visibles en el empaque' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    await waitFor(() => {
      expect(lastBody).toMatchObject({
        order_number: 'ORD-100',
        reason:       'DAMAGED_PRODUCT',
      });
    });
  });

  it('muestra confirmacion con el numero de solicitud creada', async () => {
    server.use(
      http.post(`${BASE}/api/v2/return-requests/`, async ({ request }) => {
        await request.json();
        return HttpResponse.json({ id: 77, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Pedido a devolver/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con un golpe muy visible' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(await screen.findByText(/Devoluci.n #77/)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // D-008 — UC-RET-01 Alt A: subida de fotos (multipart/form-data)
  // -------------------------------------------------------------------------

  function makeFile(name, size = 1024, type = 'image/jpeg') {
    const blob = new Blob(['x'.repeat(size)], { type });
    return new File([blob], name, { type });
  }

  it('renderiza el input de fotos opcional', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    expect(screen.getByLabelText(/Fotos del producto/i)).toBeInTheDocument();
  });

  it('envia FormData con las fotos cuando el comprador adjunta archivos', async () => {
    let capturedContentType;
    server.use(
      http.post(`${BASE}/api/v2/return-requests/`, ({ request }) => {
        capturedContentType = request.headers.get('content-type') ?? '';
        return HttpResponse.json({ id: 88, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Pedido a devolver/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con una rotura visible' } });

    const file1 = makeFile('frente.jpg');
    const file2 = makeFile('reverso.jpg');
    fireEvent.change(screen.getByLabelText(/Fotos del producto/i), {
      target: { files: [file1, file2] },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    await waitFor(() => expect(capturedContentType).toBeTruthy());
    expect(capturedContentType).toMatch(/multipart\/form-data/i);
  });

  it('rechaza si el comprador adjunta mas de 4 fotos', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Pedido a devolver/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con varios defectos visibles' } });
    const files = [1, 2, 3, 4, 5].map((n) => makeFile(`f${n}.jpg`));
    fireEvent.change(screen.getByLabelText(/Fotos del producto/i), {
      target: { files },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByText(/hasta 4 fotos/i)).toBeInTheDocument();
  });

  it('rechaza si alguna foto supera 5 MB', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Pedido a devolver/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con defectos en la superficie' } });
    const big = makeFile('grande.jpg', 6 * 1024 * 1024);
    fireEvent.change(screen.getByLabelText(/Fotos del producto/i), {
      target: { files: [big] },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByText(/supera 5 MB/i)).toBeInTheDocument();
  });

  it('si no hay fotos, envia el payload JSON tradicional (compatibilidad)', async () => {
    let capturedContentType;
    server.use(
      http.post(`${BASE}/api/v2/return-requests/`, ({ request }) => {
        capturedContentType = request.headers.get('content-type') ?? '';
        return HttpResponse.json({ id: 99, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Pedido a devolver/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con un golpe muy visible' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    await waitFor(() => expect(capturedContentType).toBeTruthy());
    expect(capturedContentType).toMatch(/application\/json/i);
  });
});
