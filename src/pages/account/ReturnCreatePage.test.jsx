/**
 * Tests — ReturnCreatePage
 * UC-RET-01: Solicitar devolucion (Comprador)
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider }     from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import returnsReducer from '@redux/slices/returnsSlice';
import ReturnCreatePage from './ReturnCreatePage';

const makeStore = () =>
  configureStore({ reducer: { returns: returnsReducer } });

const wrap = (ui, store) => (
  <Provider store={store}>
    <MemoryRouter>{ui}</MemoryRouter>
  </Provider>
);

afterEach(() => jest.clearAllMocks());

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
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i),       { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),   { target: { value: 'corto' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));
    expect(
      screen.getByText(/al menos 20 caracteres/i)
    ).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('muestra error si la orden esta vacia', () => {
    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'Descripcion mas que suficiente del problema' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));
    expect(screen.getByText(/La orden es obligatoria/i)).toBeInTheDocument();
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('envia la solicitud al backend cuando el formulario es valido', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 50, status: 'PENDIENTE_REVISION' },
    });

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i),     { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Motivo/i),    { target: { value: 'PRODUCTO_DANADO' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con daños visibles en el empaque' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    await waitFor(() => {
      expect(apiService.post).toHaveBeenCalledWith(
        expect.stringContaining('/returns/'),
        expect.objectContaining({
          order_id: 'ORD-100',
          reason:   'PRODUCTO_DANADO',
        }),
      );
    });
  });

  it('muestra confirmacion con el numero de solicitud creada', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 77, status: 'PENDIENTE_REVISION' },
    });

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
    apiService.post.mockResolvedValue({
      data: { id: 88, status: 'PENDIENTE_REVISION' },
    });

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

    await waitFor(() => expect(apiService.post).toHaveBeenCalled());
    const [, body] = apiService.post.mock.calls[0];
    expect(body).toBeInstanceOf(FormData);
    expect(body.get('order_id')).toBe('ORD-100');
    expect(body.get('reason')).toBe('PRODUCTO_DANADO');
    const photoEntries = body.getAll('photos');
    expect(photoEntries).toHaveLength(2);
    expect(photoEntries[0]).toBeInstanceOf(File);
    expect(photoEntries[0].name).toBe('frente.jpg');
  });

  it('rechaza si el comprador adjunta mas de 4 fotos', () => {
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
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('rechaza si alguna foto supera 5 MB', () => {
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
    expect(apiService.post).not.toHaveBeenCalled();
  });

  it('si no hay fotos, envia el payload JSON tradicional (compatibilidad)', async () => {
    apiService.post.mockResolvedValue({
      data: { id: 99, status: 'PENDIENTE_REVISION' },
    });

    render(wrap(<ReturnCreatePage />, makeStore()));
    fireEvent.change(screen.getByLabelText(/Orden/i), { target: { value: 'ORD-100' } });
    fireEvent.change(screen.getByLabelText(/Descripci/i),
      { target: { value: 'El producto llego con un golpe muy visible' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar solicitud/i }));

    await waitFor(() => expect(apiService.post).toHaveBeenCalled());
    const [, body] = apiService.post.mock.calls[0];
    expect(body).not.toBeInstanceOf(FormData);
    expect(body).toEqual(expect.objectContaining({
      order_id:    'ORD-100',
      reason:      'PRODUCTO_DANADO',
      description: expect.any(String),
    }));
  });
});
