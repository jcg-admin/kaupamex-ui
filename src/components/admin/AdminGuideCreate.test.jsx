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
        return HttpResponse.json({ tracking_number: body.tracking_number, courier: { name: 'DHL' } }, { status: 201 });
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
    expect(await screen.findByText(/Guía creada con rastreo/)).toBeInTheDocument();
  });

  it('valida courier y tracking obligatorios', async () => {
    render(wrap());
    await screen.findByRole('option', { name: 'DHL' });
    fireEvent.click(screen.getByRole('button', { name: /Crear guía/ }));
    expect(await screen.findByText(/Selecciona un courier/)).toBeInTheDocument();
  });
});
