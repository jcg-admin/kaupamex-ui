/**
 * AdminCouriersPage (UC-LOG-01 soporte) — catálogo de paqueterías.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import logisticsReducer from '@redux/slices/logisticsSlice';
import AdminCouriersPage from './AdminCouriersPage';

// jsdom no implementa <dialog>.showModal() — polyfill (igual que Modal.test).
HTMLDialogElement.prototype.showModal = jest.fn(function () { this.open = true; });
HTMLDialogElement.prototype.close     = jest.fn(function () { this.open = false; });

const BASE = process.env.API_URL || 'http://localhost:8000';
const store = () => configureStore({ reducer: { logistics: logisticsReducer } });
const wrap = () => <Provider store={store()}><AdminCouriersPage /></Provider>;

describe('AdminCouriersPage (UC-LOG-01 soporte)', () => {
  beforeEach(() => {
    server.use(
      http.get(`${BASE}/api/v2/logistics/couriers/`, () =>
        HttpResponse.json([
          { id: 3, name: 'DHL', code: 'DHLMX', tracking_url_template: '', is_active: true },
          { id: 4, name: 'Estafeta', code: 'EST', tracking_url_template: 'https://x/{tracking_number}', is_active: false },
        ]),
      ),
    );
  });

  it('lista las paqueterías con su estado', async () => {
    render(wrap());
    expect(await screen.findByText('DHL')).toBeInTheDocument();
    expect(screen.getByText('Estafeta')).toBeInTheDocument();
    expect(screen.getByText('Activa')).toBeInTheDocument();
    expect(screen.getByText('Inactiva')).toBeInTheDocument();
  });

  it('crea una paquetería con name y code', async () => {
    let body;
    server.use(
      http.post(`${BASE}/api/v2/logistics/couriers/`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: 9, name: body.name, code: body.code, is_active: true }, { status: 201 });
      }),
    );
    render(wrap());
    await screen.findByText('DHL');
    fireEvent.change(screen.getByLabelText(/Nombre/), { target: { value: 'FedEx' } });
    fireEvent.change(screen.getByLabelText(/Código/), { target: { value: 'FDX' } });
    fireEvent.click(screen.getByRole('button', { name: /Crear paquetería/ }));
    await waitFor(() => expect(body).toEqual(
      expect.objectContaining({ name: 'FedEx', code: 'FDX' }),
    ));
    expect(await screen.findByText('FedEx')).toBeInTheDocument();
  });

  it('valida name y code obligatorios', async () => {
    render(wrap());
    await screen.findByText('DHL');
    fireEvent.click(screen.getByRole('button', { name: /Crear paquetería/ }));
    expect(await screen.findByText(/El nombre es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/El código es obligatorio/)).toBeInTheDocument();
  });

  it('desactiva una paquetería activa tras confirmar', async () => {
    let deleted = false;
    server.use(
      http.delete(`${BASE}/api/v2/logistics/couriers/3/`, () => {
        deleted = true;
        return HttpResponse.json({ deactivated: true });
      }),
    );
    render(wrap());
    await screen.findByText('DHL');
    fireEvent.click(screen.getByRole('button', { name: 'Desactivar' }));
    const confirmBtns = await screen.findAllByRole('button', { name: 'Desactivar' });
    fireEvent.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => expect(deleted).toBe(true));
  });

  it('reactiva una paquetería inactiva', async () => {
    let patched;
    server.use(
      http.patch(`${BASE}/api/v2/logistics/couriers/4/`, async ({ request }) => {
        patched = await request.json();
        return HttpResponse.json({ id: 4, name: 'Estafeta', code: 'EST', is_active: true });
      }),
    );
    render(wrap());
    await screen.findByText('Estafeta');
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }));
    await waitFor(() => expect(patched).toEqual({ is_active: true }));
  });
});
