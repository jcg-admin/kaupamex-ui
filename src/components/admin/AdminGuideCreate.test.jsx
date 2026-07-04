/**
 * AdminGuideCreate (COV-04a / UC-LOG-01) — crear guía de envío.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import logisticsReducer from '@redux/slices/logisticsSlice';
import AdminGuideCreate from './AdminGuideCreate';

// jsdom no implementa <dialog>.showModal() — polyfill (igual que Modal.test).
HTMLDialogElement.prototype.showModal = jest.fn(function () { this.open = true; });
HTMLDialogElement.prototype.close     = jest.fn(function () { this.open = false; });

const BASE = process.env.API_URL || 'http://localhost:8000';
const store = () => configureStore({ reducer: { logistics: logisticsReducer } });
const wrap = (props) => (
  <Provider store={store()}><AdminGuideCreate orderNumber="PY-ABC123" {...props} /></Provider>
);

describe('AdminGuideCreate (COV-04a)', () => {
  beforeEach(() => {
    server.use(
      http.get(`${BASE}/api/v2/logistics/couriers/`, () =>
        HttpResponse.json([{ id: 3, name: 'DHL' }, { id: 4, name: 'Estafeta' }]),
      ),
      // Por defecto la orden no tiene guía → 404 → se muestra el form de creación.
      http.get(`${BASE}/api/v2/logistics/admin/orders/:num/guide/`, () =>
        HttpResponse.json({ codigo_error: 'SHIPMENT_GUIDE_NOT_FOUND' }, { status: 404 }),
      ),
    );
  });

  it('carga los couriers en el selector', async () => {
    render(wrap());
    expect(await screen.findByRole('option', { name: 'DHL' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Estafeta' })).toBeInTheDocument();
  });

  it('crea la guía con order_number, courier y tracking', async () => {
    let body;
    server.use(
      http.post(`${BASE}/api/v2/logistics/guides/`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 5, tracking_number: body.tracking_number, status: 'CREATED', courier: { name: 'DHL' } }, { status: 201 });
      }),
    );
    render(wrap());
    await screen.findByRole('option', { name: 'DHL' });
    fireEvent.change(screen.getByLabelText(/Courier/), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText(/Número de rastreo/), { target: { value: 'TRK-999' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear guía/ }));

    await waitFor(() => expect(body).toEqual(
      expect.objectContaining({ order_number: 'PY-ABC123', courier_id: 3, tracking_number: 'TRK-999' }),
    ));
    // Tras crear, cambia a la vista de gestión de la guía.
    expect(await screen.findByText('TRK-999')).toBeInTheDocument();
    expect(screen.getByText(/Guía creada\./)).toBeInTheDocument();
  });

  it('valida courier y tracking obligatorios', async () => {
    render(wrap());
    await screen.findByRole('option', { name: 'DHL' });
    fireEvent.click(screen.getByRole('button', { name: /Crear guía/ }));
    expect(await screen.findByText(/Selecciona un courier/)).toBeInTheDocument();
  });

  it('si la orden ya tiene guía, muestra el estado y permite avanzarlo', async () => {
    let patched;
    server.use(
      http.get(`${BASE}/api/v2/logistics/admin/orders/:num/guide/`, () =>
        HttpResponse.json({ id: 9, tracking_number: 'T-9', status: 'CREATED', courier: { name: 'DHL' } }),
      ),
      http.patch(`${BASE}/api/v2/logistics/guides/9/`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ id: 9, tracking_number: 'T-9', status: 'PICKED_UP', courier: { name: 'DHL' } });
      }),
    );
    render(wrap());
    // Muestra el estado actual (no el form de creación).
    expect(await screen.findByText('Guía creada')).toBeInTheDocument();
    expect(screen.getByText('T-9')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Avanzar estado/), { target: { value: 'PICKED_UP' } });
    fireEvent.click(screen.getByRole('button', { name: /Actualizar estado/ }));
    await waitFor(() => expect(patched).toEqual({ status: 'PICKED_UP' }));
    expect(await screen.findByText(/Estado actualizado/)).toBeInTheDocument();
  });

  it('cancela la guía vía el endpoint dedicado tras confirmar', async () => {
    let cancelled = false;
    server.use(
      http.get(`${BASE}/api/v2/logistics/admin/orders/:num/guide/`, () =>
        HttpResponse.json({ id: 9, tracking_number: 'T-9', status: 'CREATED', courier: { name: 'DHL' } }),
      ),
      http.post(`${BASE}/api/v2/logistics/guides/9/cancel/`, () => {
        cancelled = true;
        return HttpResponse.json({ cancelled: true, tracking_number: 'T-9' });
      }),
    );
    render(wrap());
    await screen.findByText('T-9');
    // Abre el diálogo de confirmación.
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar guía' }));
    // Confirma dentro del diálogo (el botón de confirmación comparte etiqueta).
    const confirmBtns = await screen.findAllByRole('button', { name: 'Cancelar guía' });
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => expect(cancelled).toBe(true));
    expect(await screen.findByText(/Guía cancelada/)).toBeInTheDocument();
    // Ya cancelada: no debe ofrecer avanzar estado.
    expect(screen.queryByLabelText(/Avanzar estado/)).not.toBeInTheDocument();
  });
});
