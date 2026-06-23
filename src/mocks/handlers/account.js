import { http, HttpResponse } from 'msw';

const BASE = process.env.API_URL || 'http://localhost:8000';

const mockProfile = {
  id: 1,
  username: 'usuario1',
  email: 'u1@test.com',
  first_name: 'Ana',
  last_name: 'García',
  phone: '+1-555-0100',
  avatar: null,
  date_joined: '2026-01-10T00:00:00',
  is_active: true,
};

const mockAddresses = [
  {
    id: 1,
    label: 'Casa',
    street: 'Calle 123',
    city: 'Ciudad',
    state: 'Estado',
    zip_code: '01000',
    country: 'MX',
    is_default: true,
  },
];

const mockNotificationPrefs = {
  order_updates: true,
  promotions: false,
  newsletter: true,
  low_stock_alerts: false,
};

export const accountHandlers = [
  // Profile
  http.get(`${BASE}/api/v1/account/profile/`, () =>
    HttpResponse.json(mockProfile),
  ),
  http.patch(`${BASE}/api/v1/account/profile/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockProfile, ...body });
  }),

  // Avatar
  http.post(`${BASE}/api/v1/account/profile/avatar/`, () =>
    HttpResponse.json({ avatar: '/media/avatars/usuario1.jpg' }),
  ),
  http.delete(`${BASE}/api/v1/account/profile/avatar/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Change password
  http.post(`${BASE}/api/v1/account/change-password/`, async ({ request }) => {
    const body = await request.json();
    if (!body.old_password || !body.new_password) {
      return HttpResponse.json({ detail: 'Campos requeridos' }, { status: 400 });
    }
    return HttpResponse.json({ detail: 'Contraseña actualizada' });
  }),

  // Email verification
  http.post(`${BASE}/api/v1/account/verify-email/`, async ({ request }) => {
    const body = await request.json();
    if (body.token === 'valid-token') {
      return HttpResponse.json({ detail: 'Email verificado' });
    }
    return HttpResponse.json({ detail: 'Token inválido' }, { status: 400 });
  }),
  http.post(`${BASE}/api/v1/account/resend-verification/`, () =>
    HttpResponse.json({ detail: 'Email de verificación enviado' }),
  ),

  // Two-factor auth
  http.get(`${BASE}/api/v1/account/2fa/status/`, () =>
    HttpResponse.json({ enabled: false, method: null }),
  ),
  http.post(`${BASE}/api/v1/account/2fa/enable/`, () =>
    HttpResponse.json({ secret: 'JBSWY3DPEHPK3PXP', qr_url: 'data:image/png;base64,abc' }),
  ),
  http.post(`${BASE}/api/v1/account/2fa/verify/`, async ({ request }) => {
    const body = await request.json();
    if (body.code === '123456') {
      return HttpResponse.json({ detail: '2FA activado' });
    }
    return HttpResponse.json({ detail: 'Código inválido' }, { status: 400 });
  }),
  http.post(`${BASE}/api/v1/account/2fa/disable/`, () =>
    HttpResponse.json({ detail: '2FA desactivado' }),
  ),

  // Addresses
  http.get(`${BASE}/api/v1/account/addresses/`, () =>
    HttpResponse.json({ count: mockAddresses.length, results: mockAddresses }),
  ),
  http.post(`${BASE}/api/v1/account/addresses/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: mockAddresses.length + 1, is_default: false, ...body }, { status: 201 });
  }),
  http.patch(`${BASE}/api/v1/account/addresses/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const addr = mockAddresses.find(a => String(a.id) === params.id);
    if (!addr) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...addr, ...body });
  }),
  http.delete(`${BASE}/api/v1/account/addresses/:id/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
  http.post(`${BASE}/api/v1/account/addresses/:id/set-default/`, ({ params }) => {
    const addr = mockAddresses.find(a => String(a.id) === params.id);
    if (!addr) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...addr, is_default: true });
  }),

  // Notification preferences
  http.get(`${BASE}/api/v1/account/notifications/preferences/`, () =>
    HttpResponse.json(mockNotificationPrefs),
  ),
  http.patch(`${BASE}/api/v1/account/notifications/preferences/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockNotificationPrefs, ...body });
  }),

  // Account deactivation
  http.post(`${BASE}/api/v1/account/deactivate/`, async ({ request }) => {
    const body = await request.json();
    if (!body.password) {
      return HttpResponse.json({ detail: 'Contraseña requerida' }, { status: 400 });
    }
    return HttpResponse.json({ detail: 'Cuenta desactivada' });
  }),

  // Order history (customer-facing)
  http.get(`${BASE}/api/v1/account/orders/`, () =>
    HttpResponse.json({
      count: 2,
      results: [
        { id: 1, number: 'PY-0001', status: 'DELIVERED', total: '198.00', created_at: '2026-01-15T10:00:00' },
        { id: 2, number: 'PY-0002', status: 'PENDING', total: '99.00', created_at: '2026-06-01T09:00:00' },
      ],
    }),
  ),
  http.get(`${BASE}/api/v1/account/orders/:id/`, ({ params }) =>
    HttpResponse.json({
      id: Number(params.id),
      number: `PY-000${params.id}`,
      status: 'DELIVERED',
      total: '198.00',
      items: [{ product_name: 'Vela Yoruba Roja', quantity: 2, price: '99.00' }],
      created_at: '2026-01-15T10:00:00',
    }),
  ),

  // Returns (customer-facing)
  http.get(`${BASE}/api/v1/account/returns/`, () =>
    HttpResponse.json({ count: 0, results: [] }),
  ),
  http.post(`${BASE}/api/v1/account/returns/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 1, status: 'PENDING', ...body }, { status: 201 });
  }),

  // Wishlist
  http.get(`${BASE}/api/v1/account/wishlist/`, () =>
    HttpResponse.json({ count: 0, results: [] }),
  ),
  http.post(`${BASE}/api/v1/account/wishlist/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 1, product_id: body.product_id }, { status: 201 });
  }),
  http.delete(`${BASE}/api/v1/account/wishlist/:id/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
