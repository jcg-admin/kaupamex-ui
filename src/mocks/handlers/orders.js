import { http, HttpResponse } from 'msw';

const BASE = process.env.API_URL || 'http://localhost:8000';

const MOCK_ORDERS = [
  {
    id: 1, number: 'PY-0001', status: 'PENDING',
    total: '198.00', created_at: '2026-01-15T10:00:00',
    items: [{ id: 1, product_name: 'Vela Yoruba', quantity: 2, unit_price: '99.00' }],
  },
  {
    id: 2, number: 'PY-0002', status: 'DELIVERED',
    total: '99.00', created_at: '2026-01-20T12:00:00',
    items: [{ id: 2, product_name: 'Collar Eshu', quantity: 1, unit_price: '99.00' }],
  },
];

export const ordersHandlers = [
  http.get(`${BASE}/api/v2/orders/`, () =>
    HttpResponse.json({ count: MOCK_ORDERS.length, results: MOCK_ORDERS }),
  ),

  http.get(`${BASE}/api/v2/orders/:id/`, ({ params }) => {
    const order = MOCK_ORDERS.find(o => String(o.id) === params.id);
    if (!order) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(order);
  }),

  http.patch(`${BASE}/api/v2/admin/orders/:id/`, async ({ params, request }) => {
    const body  = await request.json();
    const order = MOCK_ORDERS.find(o => String(o.id) === params.id);
    if (!order) return new HttpResponse(null, { status: 404 });
    Object.assign(order, body);
    return HttpResponse.json(order);
  }),
];
