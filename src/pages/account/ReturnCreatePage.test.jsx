/**
 * Tests — ReturnCreatePage
 * UC-RET-01: Solicitar devolucion (Comprador)
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

import returnsReducer from '@redux/slices/returnsSlice';
import ReturnCreatePage from './ReturnCreatePage';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

describe('ReturnCreatePage (UC-RET-01)', () => {
  it('muestra el titulo de la pagina', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    expect(
      screen.getByRole('heading', { name: /Solicitar devoluci/i })
    ).toBeInTheDocument();
  });

  it('renderiza los campos obligatorios', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    expect(screen.getByLabelText(/Orden/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripci/i)).toBeInTheDocument();
  });

  it('muestra error si la descripcion tiene menos de 20 caracteres', () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/v1/returns/`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i),       { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),   { target: { value: 'corto' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));
    expect(
      screen.getByText(/al menos 20 caracteres/i)
    ).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('muestra error si la orden esta vacia', () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/v1/returns/`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'Descripcion mas que suficiente del problema' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));
    expect(screen.getByText(/La orden es obligatoria/i)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('envia la solicitud al backend cuando el formulario es valido', async () => {
    let lastBody;
    server.use(
      http.post(`${BASE}/api/v1/returns/`, async ({ request }) => {
        lastBody = await request.json();
        return HttpResponse.json({ id: 50, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i),     { target: { value: 'ORD-100' } });
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
      http.post(`${BASE}/api/v1/returns/`, async ({ request }) => {
        await request.json();
        return HttpResponse.json({ id: 77, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i),     { target: { value: 'ORD-100' } });
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
      http.post(`${BASE}/api/v1/returns/`, ({ request }) => {
        capturedContentType = request.headers.get('content-type') ?? '';
        return HttpResponse.json({ id: 88, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con una rotura visible' } });

    const file1 = makeFile('frente.jpg');
    const file2 = makeFile('reverso.jpg');
    fireEvent.change(screen.getByLabelText(/Fotos del producto/i), {
      target: { files: [file1, file2] },
    });

    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    await waitFor(() => expect(capturedContentType).toBeTruthy());
    // FormData requests send multipart/form-data
    expect(capturedContentType).toMatch(/multipart\/form-data/i);
  });

  it('rechaza si el comprador adjunta mas de 4 fotos', () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/v1/returns/`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con varios defectos visibles' } });
    const files = [1, 2, 3, 4, 5].map((n) => makeFile(`f${n}.jpg`));
    fireEvent.change(screen.getByLabelText(/Fotos del producto/i), {
      target: { files },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByText(/hasta 4 fotos/i)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('rechaza si alguna foto supera 5 MB', () => {
    let called = false;
    server.use(
      http.post(`${BASE}/api/v1/returns/`, () => {
        called = true;
        return HttpResponse.json({});
      }),
    );
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con defectos en la superficie' } });
    const big = makeFile('grande.jpg', 6 * 1024 * 1024);
    fireEvent.change(screen.getByLabelText(/Fotos del producto/i), {
      target: { files: [big] },
    });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    expect(screen.getByText(/supera 5 MB/i)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('si no hay fotos, envia el payload JSON tradicional (compatibilidad)', async () => {
    let capturedContentType;
    server.use(
      http.post(`${BASE}/api/v1/returns/`, ({ request }) => {
        capturedContentType = request.headers.get('content-type') ?? '';
        return HttpResponse.json({ id: 99, status: 'PENDING_REVIEW' });
      }),
    );

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con un golpe muy visible' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    await waitFor(() => expect(capturedContentType).toBeTruthy());
    // JSON payload: content-type should be application/json
    expect(capturedContentType).toMatch(/application\/json/i);
  });
});
