/**
 * Tests — ShipmentQuoter (UC-LOG-09, admin cotizador de paqueterías).
 * Consume POST /api/v2/shipping-offers y renderiza ofertas rankeadas +
 * inelegibles. La superficie es admin-only (logistics.manage) en el backend.
 */
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

import logisticsReducer from '@redux/slices/logisticsSlice';
import ShipmentQuoter from './ShipmentQuoter';

const BASE = process.env.API_URL || 'http://localhost:8000';
const OFFERS = `${BASE}/api/v2/shipping-offers/`;

const makeStore = () => configureStore({ reducer: { logistics: logisticsReducer } });
const wrap = (store) => (
  <Provider store={store}><ShipmentQuoter /></Provider>
);

describe('ShipmentQuoter (UC-LOG-09)', () => {
  it('cotiza y renderiza ofertas rankeadas + inelegibles', async () => {
    let body;
    server.use(
      http.post(OFFERS, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({
          offers: [
            { carrier: 'DHL', total_cost: '120.00', transit_days: 2, environmental: 3, rationale: 'base 100 + 20/kg' },
          ],
          ineligible: [
            { carrier: 'FedEx', reasons: ['peso excede el máximo'] },
          ],
        });
      }),
    );
    render(wrap(makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Cotizar/i }));

    await waitFor(() => expect(body).toBeTruthy());
    // El payload es { packages: [ { length,width,height,weight,value,hazardous } ] }
    expect(body).toHaveProperty('packages');
    expect(Array.isArray(body.packages)).toBe(true);
    expect(body.packages[0]).toEqual(expect.objectContaining({
      weight: expect.any(Number), length: expect.any(Number), hazardous: false,
    }));

    expect(await screen.findByText('DHL')).toBeInTheDocument();
    expect(await screen.findByText(/FedEx/)).toBeInTheDocument();
    expect(screen.getByText(/peso excede el máximo/)).toBeInTheDocument();
  });

  it('muestra error si el gateway de cotización falla', async () => {
    server.use(
      http.post(OFFERS, () =>
        HttpResponse.json({ detail: 'bad', codigo_error: 'VALIDATION' }, { status: 400 }),
      ),
    );
    render(wrap(makeStore()));
    fireEvent.click(screen.getByRole('button', { name: /Cotizar/i }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
