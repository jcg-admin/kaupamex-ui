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
  // MercadoPago preference (legacy)
  http.post(`${BASE}/api/v1/payments/mercadopago/create-preference/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockMpPreference, order_id: body.order_id }, { status: 201 });
  }),

  // V1 initiate — Checkout Pro (PayPal + legacy MP redirect)
  http.post(`${BASE}/api/v1/payments/initiate/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      payment_id:   'pp-pay-99999',
      checkout_url: mockMpPreference.sandbox_init_point,
      order_number: body.order_number || 'PY-0001',
      amount:       '198.00',
      installments: 1,
    }, { status: 201 });
  }),

  // V2 initiate — Checkout API (MercadoPago CardForm, requires token)
  // Returns synchronous payment result (no checkout_url — on-site payment)
  http.post(`${BASE}/api/v2/payments/initiate/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      payment_id:         1,
      gateway_payment_id: 'mp-pay-12345',
      status:             'approved',
      status_detail:      'accredited',
      order_number:       body.order_number || 'PY-0001',
      amount:             '198.00',
      installments:       body.installments || 1,
    }, { status: 201 });
  }),

  // MP public key (BR-009: only public_key, never access_token)
  http.get(`${BASE}/api/v2/payments/public-key/`, () =>
    HttpResponse.json({ public_key: 'TEST-public-key-mock' }),
  ),

  // MP customer (v2)
  http.get(`${BASE}/api/v2/payments/customer/`, () =>
    HttpResponse.json({ mp_customer_id: 'CUST-mock-001', email: 'test@example.com' }),
  ),

  // Payment webhook (MP notification)
  http.post(`${BASE}/api/v1/payments/mercadopago/webhook/`, () =>
    new HttpResponse(null, { status: 200 }),
  ),

  // Payment return (user returns from MP)
  http.get(`${BASE}/api/v1/payments/mercadopago/return/`, () =>
    HttpResponse.json(mockPaymentResult),
  ),

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

  // Payment methods list (UC-PAY-15)
  http.get(`${BASE}/api/v2/payments/methods/`, () =>
    HttpResponse.json([
      { id: 'visa',          name: 'Visa',                   payment_type_id: 'credit_card',   thumbnail: '', secure_thumbnail: '', min_allowed_amount: 1, max_allowed_amount: 60000, accreditation_time: 2880 },
      { id: 'oxxo',          name: 'OXXO',                   payment_type_id: 'ticket',        thumbnail: '', secure_thumbnail: '', min_allowed_amount: 5, max_allowed_amount: 10000, accreditation_time: 2880 },
      { id: 'clabe',         name: 'Transferencia bancaria',  payment_type_id: 'bank_transfer', thumbnail: '', secure_thumbnail: '', min_allowed_amount: 1, max_allowed_amount: 100000, accreditation_time: 60 },
      { id: 'paycash',       name: 'Paycash',                payment_type_id: 'ticket',        thumbnail: '', secure_thumbnail: '', min_allowed_amount: 5, max_allowed_amount: 10000, accreditation_time: 2880 },
      { id: 'banamex',       name: 'Banamex',                payment_type_id: 'atm',           thumbnail: '', secure_thumbnail: '', min_allowed_amount: 5, max_allowed_amount: 10000, accreditation_time: 2880 },
      { id: 'serfin',        name: 'Santander',              payment_type_id: 'atm',           thumbnail: '', secure_thumbnail: '', min_allowed_amount: 5, max_allowed_amount: 10000, accreditation_time: 2880 },
      { id: 'bancomer',      name: 'BBVA Bancomer',          payment_type_id: 'atm',           thumbnail: '', secure_thumbnail: '', min_allowed_amount: 5, max_allowed_amount: 10000, accreditation_time: 2880 },
      { id: 'account_money', name: 'Cuenta Mercado Pago',    payment_type_id: 'account_money', thumbnail: '', secure_thumbnail: '', min_allowed_amount: 1, max_allowed_amount: 60000, accreditation_time: 0 },
    ]),
  ),

  // Customer cards — list active
  http.get(`${BASE}/api/v2/payments/cards/`, () =>
    HttpResponse.json([]),
  ),

  // Card validate (Zero Dollar Auth — T-15)
  http.post(`${BASE}/api/v2/payments/cards/validate/`, () =>
    HttpResponse.json({ valid: true }),
  ),

  // Customer cards — save card
  http.post(`${BASE}/api/v2/payments/cards/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      { id: 'card-mock-001', last_four_digits: '1234', status: 'pending_verification', verification_sent: true },
      { status: 201 },
    );
  }),

  // Customer card — detail / update / delete
  http.get(`${BASE}/api/v2/payments/cards/:cardId/`, ({ params }) =>
    HttpResponse.json({ id: params.cardId, last_four_digits: '1234', status: 'active', expiration_month: 12, expiration_year: 2028 }),
  ),

  http.put(`${BASE}/api/v2/payments/cards/:cardId/`, async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.cardId, last_four_digits: '1234', status: 'active', ...body });
  }),

  http.delete(`${BASE}/api/v2/payments/cards/:cardId/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Card verify token
  http.get(`${BASE}/api/v2/payments/cards/verify/:token/`, ({ params }) =>
    HttpResponse.json({ message: '¡Tu tarjeta ha sido activada exitosamente!', last_four_digits: '1234', status: 'active' }),
  ),

  // Voucher validation at checkout
  http.post(`${BASE}/api/v1/vouchers/validate/`, async ({ request }) => {
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
