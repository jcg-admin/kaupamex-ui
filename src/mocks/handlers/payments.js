import { http, HttpResponse } from 'msw';

const BASE = process.env.API_URL || 'http://localhost:8000';

const mockMpPreference = {
  preference_id: 'MP-PREF-001',
  init_point: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=MP-PREF-001',
  sandbox_init_point: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=MP-PREF-001',
};

const mockPaymentResult = {
  payment_id: 'mp-pay-12345',
  status: 'approved',
  status_detail: 'accredited',
  order_id: 1,
  order_number: 'PY-0001',
  amount: '198.00',
};

export const paymentsHandlers = [
  // MercadoPago preference
  http.post(`${BASE}/api/v2/payments/mercadopago/create-preference/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockMpPreference, order_id: body.order_id }, { status: 201 });
  }),

  // Payment webhook (MP notification)
  http.post(`${BASE}/api/v2/payments/mercadopago/webhook/`, () =>
    new HttpResponse(null, { status: 200 }),
  ),

  // Payment return (user returns from MP)
  http.get(`${BASE}/api/v2/payments/mercadopago/return/`, () =>
    HttpResponse.json(mockPaymentResult),
  ),

  // Initiate payment (v2 — unified gateway endpoint)
  http.post(`${BASE}/api/v2/payments/initiate/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      payment_id: 'mp-pay-12345',
      checkout_url: mockMpPreference.sandbox_init_point,
      order_number: body.order_number || 'PY-0001',
      amount: '198.00',
    }, { status: 201 });
  }),

  // Checkout eligibility (v2)
  http.get(`${BASE}/api/v2/checkout/eligibility/`, () =>
    HttpResponse.json({ eligible: true, reason: null }),
  ),

  // Payment status (v2)
  http.get(`${BASE}/api/v2/payments/:id/status/`, ({ params }) =>
    HttpResponse.json({ payment_id: params.id, status: 'approved', amount: '198.00' }),
  ),

  // Payment history (v2)
  http.get(`${BASE}/api/v2/payments/:id/history/`, ({ params }) =>
    HttpResponse.json([{ payment_id: params.id, status: 'approved', amount: '198.00' }]),
  ),

  // Order checkout (initiate payment) — v2
  http.post(`${BASE}/api/v2/orders/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      order_id: 1,
      order_number: 'PY-0001',
      total: body.total || '198.00',
      payment_url: mockMpPreference.sandbox_init_point,
    }, { status: 201 });
  }),

  // Express checkout (v2)
  http.post(`${BASE}/api/v2/checkout/express/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      order_id: 2,
      order_number: 'PY-0002',
      total: body.total || '99.00',
      payment_url: mockMpPreference.sandbox_init_point,
    }, { status: 201 });
  }),

  // Voucher validation at checkout
  http.post(`${BASE}/api/v2/vouchers/validate/`, async ({ request }) => {
    const body = await request.json();
    if (body.code === 'YORUBA10') {
      return HttpResponse.json({
        valid: true,
        discount_type: 'PERCENT',
        discount_value: '10.00',
        code: body.code,
      });
    }
    return HttpResponse.json({ valid: false, detail: 'Cupón no válido' }, { status: 400 });
  }),
];
