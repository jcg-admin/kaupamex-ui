/**
 * ShipmentTracking (COV-04b / UC-LOG-06) — visibilidad de envío del comprador.
 */
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import ShipmentTracking from './ShipmentTracking';

const BASE = process.env.API_URL || 'http://localhost:8000';

describe('ShipmentTracking (COV-04b)', () => {
  it('muestra courier, rastreo y estado cuando hay guía', async () => {
    server.use(
      http.get(`${BASE}/api/v2/logistics/buyer/orders/PY-1/guide/`, () =>
        HttpResponse.json({
          tracking_number: 'TRK-1', status: 'IN_TRANSIT',
          courier_name: 'DHL', tracking_url: 'https://dhl.com/TRK-1',
        }),
      ),
    );
    render(<ShipmentTracking orderNumber="PY-1" />);
    expect(await screen.findByText('DHL')).toBeInTheDocument();
    expect(screen.getByText('En tránsito')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /TRK-1/ })).toHaveAttribute('href', 'https://dhl.com/TRK-1');
  });

  it('no renderiza nada si no hay guía (404)', async () => {
    server.use(
      http.get(`${BASE}/api/v2/logistics/buyer/orders/PY-2/guide/`, () =>
        HttpResponse.json({ codigo_error: 'SHIPMENT_GUIDE_NOT_FOUND' }, { status: 404 }),
      ),
    );
    const { container } = render(<ShipmentTracking orderNumber="PY-2" />);
    // Da tiempo al fetch; el componente no debe montar la sección.
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector('section')).toBeNull();
  });
});
