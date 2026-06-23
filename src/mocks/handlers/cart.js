import { http, HttpResponse } from 'msw';

const BASE = process.env.API_URL || 'http://localhost:8000';

let mockCart = { items: [], total: '0.00', item_count: 0 };

export const cartHandlers = [
  http.get(`${BASE}/api/v1/cart/`, () =>
    HttpResponse.json(mockCart),
  ),

  http.post(`${BASE}/api/v1/cart/items/`, async ({ request }) => {
    const body = await request.json();
    const existing = mockCart.items.find(i => i.variant_id === body.variant_id);
    if (existing) {
      existing.quantity += body.quantity ?? 1;
    } else {
      mockCart.items.push({
        id:         mockCart.items.length + 1,
        variant_id: body.variant_id,
        quantity:   body.quantity ?? 1,
        unit_price: '99.00',
        subtotal:   '99.00',
      });
    }
    mockCart.item_count = mockCart.items.reduce((s, i) => s + i.quantity, 0);
    return HttpResponse.json(mockCart, { status: 201 });
  }),

  http.delete(`${BASE}/api/v1/cart/items/:id/`, ({ params }) => {
    mockCart.items = mockCart.items.filter(i => String(i.id) !== params.id);
    mockCart.item_count = mockCart.items.reduce((s, i) => s + i.quantity, 0);
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch(`${BASE}/api/v1/cart/items/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const item = mockCart.items.find(i => String(i.id) === params.id);
    if (item) item.quantity = body.quantity;
    mockCart.item_count = mockCart.items.reduce((s, i) => s + i.quantity, 0);
    return HttpResponse.json(mockCart);
  }),
];
