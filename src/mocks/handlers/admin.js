import { http, HttpResponse } from 'msw';

const BASE = process.env.API_URL || 'http://localhost:8000';

const mockProducts = [
  { id: 1, name: 'Vela Yoruba Roja', slug: 'vela-yoruba-roja', price: '99.00',
    is_active: true, category: { id: 1, name: 'Velas' }, stock: 12 },
  { id: 2, name: 'Ifa Tablero', slug: 'ifa-tablero', price: '250.00',
    is_active: true, category: { id: 3, name: 'Tableros' }, stock: 5 },
];

const mockCategories = [
  { id: 1, name: 'Velas', slug: 'velas', product_count: 8, is_active: true },
  { id: 2, name: 'Collares', slug: 'collares', product_count: 12, is_active: true },
  { id: 3, name: 'Tableros', slug: 'tableros', product_count: 3, is_active: true },
];

const mockOrders = [
  { id: 1, number: 'PY-0001', status: 'PENDING', total: '198.00',
    customer: { username: 'usuario1', email: 'u1@test.com' },
    created_at: '2026-01-15T10:00:00' },
  { id: 2, number: 'PY-0002', status: 'DELIVERED', total: '99.00',
    customer: { username: 'usuario2', email: 'u2@test.com' },
    created_at: '2026-01-20T12:00:00' },
];

const mockUsers = [
  { id: 1, username: 'admin', email: 'admin@test.com', is_staff: true,
    is_active: true, date_joined: '2026-01-01T00:00:00' },
  { id: 2, username: 'usuario1', email: 'u1@test.com', is_staff: false,
    is_active: true, date_joined: '2026-01-10T00:00:00' },
];

const mockVouchers = [
  { id: 1, code: 'YORUBA10', discount_type: 'PERCENT', discount_value: '10.00',
    valid_from: '2026-01-01', valid_until: '2026-12-31', usage_count: 5 },
];

const mockDiscounts = [
  { id: 1, product: { id: 1, name: 'Vela Yoruba Roja' }, discount_percent: '15.00',
    valid_from: '2026-01-01', valid_until: '2026-06-30', is_active: true },
];

const mockInventory = [
  { variant_id: 10, product_id: 1, product_name: 'Vela Yoruba Roja',
    sku: 'SKU-001', stock: 12, min_threshold: 5, status: 'NORMAL' },
  { variant_id: 11, product_id: 2, product_name: 'Ifa Tablero',
    sku: 'SKU-002', stock: 2, min_threshold: 5, status: 'BAJO' },
];

const mockSalesReport = {
  period: 'month',
  total_revenue: '12500.00',
  total_orders: 87,
  series: [
    { date: '2026-06-01', revenue: '3200.00', orders: 22 },
    { date: '2026-06-08', revenue: '4100.00', orders: 28 },
    { date: '2026-06-15', revenue: '2800.00', orders: 19 },
    { date: '2026-06-22', revenue: '2400.00', orders: 18 },
  ],
};

const mockAuditLog = [
  { id: 1, timestamp: '2026-06-23T10:00:00', user: 'admin',
    action: 'UPDATE', resource: 'Product', resource_id: 1, ip: '127.0.0.1' },
  { id: 2, timestamp: '2026-06-23T09:30:00', user: 'admin',
    action: 'CREATE', resource: 'Category', resource_id: 3, ip: '127.0.0.1' },
];

const mockSettings = {
  site_name: 'PracticaYoruba',
  contact_email: 'contacto@practicayoruba.com',
  currency: 'USD',
  tax_rate: '0.00',
  maintenance_mode: false,
};

const mockPermissions = {
  staff: ['view_orders', 'edit_inventory', 'view_reports'],
  manager: ['view_orders', 'edit_inventory', 'view_reports', 'manage_products'],
  admin: ['*'],
};

const mockDashboard = {
  total_orders_today: 12,
  revenue_today: '1450.00',
  pending_orders: 5,
  low_stock_variants: 3,
  new_customers_today: 8,
};

const mockReturns = [
  { id: 1, order_number: 'PY-0001', status: 'PENDING', reason: 'DEFECTIVE',
    created_at: '2026-06-20T10:00:00' },
];

const mockSupport = [
  { id: 1, ticket_number: 'TK-001', subject: 'Problema con pedido',
    priority: 'HIGH', status: 'OPEN', created_at: '2026-06-23T08:00:00' },
];

const mockNewsletterCampaigns = [
  { id: 1, subject: 'Novedades Junio', status: 'SENT', sent_at: '2026-06-01T10:00:00',
    recipient_count: 450 },
];

const mockNewsletterSubscribers = [
  { id: 1, email: 'sub1@test.com', is_active: true, subscribed_at: '2026-01-15T00:00:00' },
  { id: 2, email: 'sub2@test.com', is_active: true, subscribed_at: '2026-02-01T00:00:00' },
];

const mockReviews = [
  { id: 5, product: { name: 'Vela Yoruba Roja' }, rating: 4, status: 'PENDING',
    author: 'usuario1', created_at: '2026-06-22T14:00:00' },
];

const mockQuestions = [
  { id: 5, product: { name: 'Vela Yoruba Roja' }, question: '¿Está disponible en rojo?',
    status: 'PENDING', author: 'usuario2', created_at: '2026-06-21T09:00:00' },
];

const mockPayments = [
  { id: 501, order_number: 'PY-0001', status: 'APPROVED', amount: '198.00',
    gateway: 'mercadopago', created_at: '2026-01-15T10:05:00' },
];

const mockTopSellers = [
  { product: { id: 1, name: 'Vela Yoruba Roja' }, units_sold: 124, revenue: '12276.00' },
  { product: { id: 2, name: 'Collar Eshu' }, units_sold: 98, revenue: '9702.00' },
];

const mockRfm = {
  champions: 12, loyal: 34, at_risk: 8, lost: 5,
  segments: [
    { name: 'Champions', count: 12, avg_revenue: '450.00' },
    { name: 'Loyal', count: 34, avg_revenue: '220.00' },
  ],
};

const mockPricePreview = [
  { variant_id: 10, sku: 'SKU-001', current_price: '99.00', new_price: '109.00' },
  { variant_id: 11, sku: 'SKU-002', current_price: '250.00', new_price: '275.00' },
];

export const adminHandlers = [
  // Dashboard — KPIs / metrics
  http.get(`${BASE}/api/v2/admin/reports/dashboard/`, () =>
    HttpResponse.json(mockDashboard),
  ),

  // Orders dashboard — transactional (UC-ORD-10)
  http.get(`${BASE}/api/v2/admin/dashboard/`, () =>
    HttpResponse.json({
      order_counts: { pending: 5, processing: 3, in_preparation: 2, shipped: 1, total_active: 11 },
      expiring_orders: [],
      day_summary: { orders_count: 7, total_revenue: '12500.00' },
      latest_orders: [],
      payment_timeout_minutes: 30,
    }),
  ),

  // Products
  http.get(`${BASE}/api/v2/admin/products/`, () =>
    HttpResponse.json({ count: mockProducts.length, results: mockProducts }),
  ),
  http.post(`${BASE}/api/v2/admin/products/`, async ({ request }) => {
    const body = await request.json();
    const p = { id: mockProducts.length + 1, is_active: true, ...body };
    return HttpResponse.json(p, { status: 201 });
  }),
  http.get(`${BASE}/api/v2/admin/products/:id/`, ({ params }) => {
    const p = mockProducts.find(x => String(x.id) === params.id);
    if (!p) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...p, variants: [] });
  }),
  http.patch(`${BASE}/api/v2/admin/products/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const p = mockProducts.find(x => String(x.id) === params.id);
    if (!p) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...p, ...body });
  }),
  http.delete(`${BASE}/api/v2/admin/products/:id/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
  http.post(`${BASE}/api/v2/admin/products/:id/deactivate/`, ({ params }) => {
    const p = mockProducts.find(x => String(x.id) === params.id);
    if (!p) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...p, is_active: false });
  }),
  http.get(`${BASE}/api/v2/admin/products/:id/variants/`, () =>
    HttpResponse.json({ count: 1, results: [{ id: 10, name: 'Default', stock: 12 }] }),
  ),
  http.post(`${BASE}/api/v2/admin/products/:id/variants/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 99, ...body }, { status: 201 });
  }),
  http.patch(`${BASE}/api/v2/admin/products/:productId/variants/:variantId/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 10, ...body });
  }),
  http.patch(`${BASE}/api/v2/admin/variants/:id/price/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ variant_id: 10, ...body });
  }),

  // Categories
  http.get(`${BASE}/api/v2/admin/categories/`, () =>
    HttpResponse.json({ count: mockCategories.length, results: mockCategories }),
  ),
  http.post(`${BASE}/api/v2/admin/categories/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: mockCategories.length + 1, is_active: true, ...body }, { status: 201 });
  }),
  http.patch(`${BASE}/api/v2/admin/categories/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const c = mockCategories.find(x => String(x.id) === params.id);
    if (!c) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...c, ...body });
  }),
  http.delete(`${BASE}/api/v2/admin/categories/:id/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),
  http.post(`${BASE}/api/v2/admin/categories/:id/deactivate/`, ({ params }) => {
    const c = mockCategories.find(x => String(x.id) === params.id);
    if (!c) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...c, is_active: false });
  }),

  // Orders (admin)
  http.get(`${BASE}/api/v2/admin/orders/`, () =>
    HttpResponse.json({ count: mockOrders.length, results: mockOrders }),
  ),
  http.patch(`${BASE}/api/v2/admin/orders/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const o = mockOrders.find(x => String(x.id) === params.id);
    if (!o) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...o, ...body });
  }),
  http.post(`${BASE}/api/v2/admin/orders/:id/status/`, async ({ params, request }) => {
    const body = await request.json();
    const o = mockOrders.find(x => String(x.id) === params.id || o?.number === params.id);
    return HttpResponse.json({ id: params.id, status: body.status });
  }),
  http.post(`${BASE}/api/v2/admin/orders/:id/cancel/`, ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'CANCELLED' }),
  ),

  // Users
  http.get(`${BASE}/api/v2/admin/users/`, () =>
    HttpResponse.json({ count: mockUsers.length, results: mockUsers }),
  ),
  http.get(`${BASE}/api/v2/admin/users/:id/`, ({ params }) => {
    const u = mockUsers.find(x => String(x.id) === params.id);
    if (!u) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(u);
  }),
  http.patch(`${BASE}/api/v2/admin/users/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const u = mockUsers.find(x => String(x.id) === params.id);
    if (!u) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...u, ...body });
  }),

  // Inventory
  http.get(`${BASE}/api/v2/admin/inventory/`, () =>
    HttpResponse.json({
      results: mockInventory,
      summary: { productos_normales: 1, productos_bajo_stock: 1, productos_agotados: 0 },
    }),
  ),
  http.post(`${BASE}/api/v2/admin/inventory/imports/`, () =>
    HttpResponse.json({ imported: 10, errors: 0 }, { status: 201 }),
  ),
  http.patch(`${BASE}/api/v2/admin/inventory/variants/:id/`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ variant_id: params.id, ...body, stock_after: body.quantity });
  }),
  http.get(`${BASE}/api/v2/admin/inventory/variants/:id/movements/`, ({ params }) =>
    HttpResponse.json({
      count: 2,
      results: [
        { id: 1, variant_id: params.id, type: 'IN', quantity: 10, created_at: '2026-06-01T10:00:00' },
        { id: 2, variant_id: params.id, type: 'OUT', quantity: 2, created_at: '2026-06-15T14:00:00' },
      ],
    }),
  ),

  // Vouchers
  http.get(`${BASE}/api/v2/admin/vouchers/`, () =>
    HttpResponse.json({ count: mockVouchers.length, results: mockVouchers }),
  ),
  http.post(`${BASE}/api/v2/admin/vouchers/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: mockVouchers.length + 1, usage_count: 0, ...body }, { status: 201 });
  }),
  http.patch(`${BASE}/api/v2/admin/vouchers/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const v = mockVouchers.find(x => String(x.id) === params.id);
    if (!v) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...v, ...body });
  }),
  http.delete(`${BASE}/api/v2/admin/vouchers/:id/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Product discounts
  http.get(`${BASE}/api/v2/admin/product-discounts/`, () =>
    HttpResponse.json({ count: mockDiscounts.length, results: mockDiscounts }),
  ),
  http.post(`${BASE}/api/v2/admin/product-discounts/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: mockDiscounts.length + 1, is_active: true, ...body }, { status: 201 });
  }),
  http.patch(`${BASE}/api/v2/admin/product-discounts/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const d = mockDiscounts.find(x => String(x.id) === params.id);
    if (!d) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...d, ...body });
  }),
  http.delete(`${BASE}/api/v2/admin/product-discounts/:id/`, () =>
    new HttpResponse(null, { status: 204 }),
  ),

  // Reports
  http.get(`${BASE}/api/v2/admin/reports/sales/`, () =>
    HttpResponse.json(mockSalesReport),
  ),
  http.get(`${BASE}/api/v2/admin/reports/top-sellers/`, () =>
    HttpResponse.json({ count: mockTopSellers.length, results: mockTopSellers }),
  ),
  http.get(`${BASE}/api/v2/admin/reports/customers-rfm/`, () =>
    HttpResponse.json(mockRfm),
  ),

  // Audit log
  http.get(`${BASE}/api/v2/admin/audit-log/`, () =>
    HttpResponse.json({ count: mockAuditLog.length, results: mockAuditLog }),
  ),

  // Settings
  http.get(`${BASE}/api/v2/admin/settings/`, () =>
    HttpResponse.json(mockSettings),
  ),
  http.patch(`${BASE}/api/v2/admin/settings/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...mockSettings, ...body });
  }),

  // Permissions / Roles
  http.get(`${BASE}/api/v2/admin/permissions/`, () =>
    HttpResponse.json(mockPermissions),
  ),
  http.get(`${BASE}/api/v2/admin/roles/:role/permissions/`, ({ params }) =>
    HttpResponse.json({ role: params.role, permissions: mockPermissions[params.role] || [] }),
  ),
  http.put(`${BASE}/api/v2/admin/roles/:role/permissions/`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ role: params.role, permissions: body.permissions });
  }),

  // Reviews (admin moderation)
  http.get(`${BASE}/api/v2/admin/reviews/`, () =>
    HttpResponse.json({ count: mockReviews.length, results: mockReviews }),
  ),
  http.post(`${BASE}/api/v2/admin/reviews/:id/approve/`, ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'APPROVED' }),
  ),
  http.post(`${BASE}/api/v2/admin/reviews/:id/reject/`, ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'REJECTED' }),
  ),

  // Questions (admin moderation)
  http.get(`${BASE}/api/v2/admin/questions/`, () =>
    HttpResponse.json({ count: mockQuestions.length, results: mockQuestions }),
  ),
  http.post(`${BASE}/api/v2/admin/questions/:id/approve/`, ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'APPROVED' }),
  ),
  http.post(`${BASE}/api/v2/admin/questions/:id/reject/`, ({ params }) =>
    HttpResponse.json({ id: params.id, status: 'REJECTED' }),
  ),
  http.post(`${BASE}/api/v2/admin/questions/:id/answer/`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.id, answer: body.answer, status: 'ANSWERED' });
  }),

  // Support
  http.get(`${BASE}/api/v2/admin/support/tickets/`, () =>
    HttpResponse.json({ count: mockSupport.length, results: mockSupport }),
  ),
  http.patch(`${BASE}/api/v2/admin/support/tickets/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const t = mockSupport.find(x => String(x.id) === params.id);
    if (!t) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...t, ...body });
  }),

  // Contact messages
  http.get(`${BASE}/api/v2/admin/contact/messages/`, () =>
    HttpResponse.json({ count: 2, results: [
      { id: 7, subject: 'Consulta', sender: 'u@test.com', status: 'NEW', created_at: '2026-06-23T08:00:00' },
    ] }),
  ),
  http.post(`${BASE}/api/v2/admin/contact/messages/:id/reply/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ message_id: 7, reply: body.reply, sent_at: '2026-06-23T09:00:00' });
  }),

  // Returns (admin)
  http.get(`${BASE}/api/v2/admin/return-requests/`, () =>
    HttpResponse.json({ count: mockReturns.length, results: mockReturns }),
  ),
  http.patch(`${BASE}/api/v2/admin/return-requests/:id/`, async ({ params, request }) => {
    const body = await request.json();
    const r = mockReturns.find(x => String(x.id) === params.id);
    if (!r) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...r, ...body });
  }),

  // Payments (admin) — v2
  http.get(`${BASE}/api/v2/admin/payments/`, () =>
    HttpResponse.json({ count: mockPayments.length, results: mockPayments }),
  ),
  http.post(`${BASE}/api/v2/payments/admin/:id/refund/`, async ({ params, request }) => {
    const body = await request.json();
    return HttpResponse.json({ payment_id: params.id, refunded: body.amount, status: 'REFUNDED' });
  }),

  // Newsletter
  http.get(`${BASE}/api/v2/admin/newsletter/campaigns/`, () =>
    HttpResponse.json({ count: mockNewsletterCampaigns.length, results: mockNewsletterCampaigns }),
  ),
  http.post(`${BASE}/api/v2/admin/newsletter/campaigns/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 2, status: 'DRAFT', ...body }, { status: 201 });
  }),
  http.get(`${BASE}/api/v2/admin/newsletter/subscribers/`, () =>
    HttpResponse.json({ count: mockNewsletterSubscribers.length, results: mockNewsletterSubscribers }),
  ),
  http.post(`${BASE}/api/v2/admin/newsletter/subscribers/:id/unsubscribe/`, ({ params }) =>
    HttpResponse.json({ id: params.id, is_active: false }),
  ),

  // Notifications (admin) — v2
  http.get(`${BASE}/api/v2/admin/notifications/audience-count/`, () =>
    HttpResponse.json({ count: 1250 }),
  ),
  http.post(`${BASE}/api/v2/admin/notifications/`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ sent: true, recipient_count: 1250, ...body }, { status: 201 });
  }),

  // Backups
  http.get(`${BASE}/api/v2/admin/backups/`, () =>
    HttpResponse.json({ count: 3, results: [
      { id: 1, created_at: '2026-06-23T00:00:00', size_mb: 45, status: 'COMPLETED' },
    ] }),
  ),
  http.post(`${BASE}/api/v2/admin/backups/trigger/`, () =>
    HttpResponse.json({ status: 'QUEUED', message: 'Backup iniciado' }, { status: 202 }),
  ),

  // Price sync (v2 — consolidated endpoint)
  http.post(`${BASE}/api/v2/admin/price-syncs/`, async ({ request }) => {
    const contentType = request.headers.get('content-type') || '';
    let type, mode;
    if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const fd = await request.formData();
      type = fd.get('type');
      mode = fd.get('mode');
    } else {
      const body = await request.json().catch(() => ({}));
      type = body.type;
      mode = body.mode;
    }
    if (type === 'apply') {
      return HttpResponse.json({ updated_count: mockPricePreview.length, errors: 0 });
    }
    return HttpResponse.json({
      session_id: 'mock-session',
      preview: mockPricePreview,
      valid_count: mockPricePreview.length,
      invalid_count: 0,
    });
  }),
  http.get(`${BASE}/api/v2/admin/price-syncs/template.csv`, () =>
    new HttpResponse('sku,price\nSKU-001,99.00\n', {
      headers: { 'Content-Type': 'text/csv' },
    }),
  ),

  // Logistics
  http.post(`${BASE}/api/v2/logistics/guides/:id/confirm-delivery/`, ({ params }) =>
    HttpResponse.json({ guide_id: params.id, status: 'DELIVERED' }),
  ),
];
