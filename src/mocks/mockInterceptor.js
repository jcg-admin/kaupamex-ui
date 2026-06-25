/**
 * Mock Interceptor — PracticaYoruba
 *
 * Intercepta requests HTTP y retorna datos mock cuando
 * el feature flag correspondiente está en 'mock'.
 *
 * Activación: PY_*_SOURCE=mock en .env.local
 * USAR SOLO EN DEVELOPMENT.
 *
 * Endpoints cubiertos:
 *   Auth:      /api/auth/*, /api/v2/auth/login/, /api/v2/auth/change-password/ (D-05-08)
 *   Addresses: /api/v2/auth/addresses/*                     (D-03-07)
 *   Catalog:   /api/v2/catalogue/*, /api/v2/catalogue/categories/*
 *   Cart:      /api/v2/cart/*
 *   Orders:    /api/v2/orders/*
 *   Checkout:  /api/v2/payments/*
 *   Wishlist:  /api/v2/wishlist/*
 *   Returns:   /api/v2/returns/*, /api/v2/admin/returns/*   (D-007)
 *   Inventory: /api/v2/admin/inventory/*                    (D-007)
 */

import { SENSITIVE_FIELDS } from '@config/securityConfig';
import { interceptReturns }   from './interceptors/returns';
import { interceptInventory } from './interceptors/inventory';

class MockInterceptor {
  constructor() {
    this.delay = 600; // ms — simula latencia de red realista
  }

  /**
   * Punto de entrada: decidir si interceptar o pasar al apiService real.
   * Retorna null si no debe interceptar.
   */
  async intercept(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();

    if (process.env.NODE_ENV !== 'development') return null;

    const body = options.body && typeof options.body === 'string'
      ? JSON.parse(options.body)
      : null;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[MOCK] ${method} ${url}`, this._sanitize(body));
    }

    // ─── Auth ───────────────────────────────────────────────────
    if (url.includes('/api/v2/auth/login/'))         return this._login(body);
    if (url.includes('/api/v2/auth/logout/'))   return this._logout();
    if (url.includes('/api/v2/auth/me/'))       return this._me();
    if (url.includes('/api/v2/auth/register/')) return this._register(body);
    // DEC-AUM-04 (T-103 D-01-10 + D-02-10): handlers para
    // verify-email + resend-verification. UC-AUTH-10 mantenimiento.
    if (url.match(/\/api\/v1\/auth\/verify-email\//)) 
      return this._verifyEmail(url);
    if (url.includes('/api/v2/auth/resend-verification/'))
      return this._resendVerification();
    // D-05-08: handler change-password
    if (url.includes('/api/v2/auth/change-password/') && method === 'POST')
      return this._changePassword(body);

    // ─── Direcciones (D-03-07) ───────────────────────────────────
    if (url.match(/\/api\/v1\/auth\/addresses\/\d+\/set-default\//) && method === 'POST')
      return this._setDefaultAddress(url);
    if (url.match(/\/api\/v1\/auth\/addresses\/\d+\//) && method === 'PATCH')
      return this._updateAddress(url, body);
    if (url.match(/\/api\/v1\/auth\/addresses\/\d+\//) && method === 'DELETE')
      return this._deleteAddress(url);
    if (url.includes('/api/v2/auth/addresses/') && method === 'POST')
      return this._createAddress(body);
    if (url.includes('/api/v2/auth/addresses/'))
      return this._listAddresses();

    // ─── Catálogo ────────────────────────────────────────────────
    if (url.includes('/api/v1/categories/'))                return this._categories();
    if (url.includes('/api/v1/catalogue/search/'))          return this._searchProducts(url);
    if (url.includes('/api/v1/catalogue/categories/'))      return this._categories();
    if (url.match(/\/api\/v1\/catalogue\/[^/]+\//))         return this._productDetail(url);
    if (url.includes('/api/v2/catalogue/'))                 return this._productList(url);

    // ─── Carrito ─────────────────────────────────────────────────
    if (url.includes('/api/v2/cart/voucher/') && method === 'POST')   return this._applyVoucher(body);
    if (url.includes('/api/v2/cart/voucher/') && method === 'DELETE') return this._removeVoucher();
    if (url.match(/\/api\/v1\/cart\/items\/\d+\//) && method === 'PATCH')  return this._updateItem(url, body);
    if (url.match(/\/api\/v1\/cart\/items\/\d+\//) && method === 'DELETE') return this._removeItem(url);
    if (url.includes('/api/v2/cart/items/') && method === 'POST') return this._addItem(body);
    if (url.includes('/api/v2/cart/'))            return this._getCart();

    // ─── Órdenes ─────────────────────────────────────────────────
    if (url.match(/\/api\/v1\/orders\/\d+\/cancel\//)) return this._cancelOrder(url);
    if (url.match(/\/api\/v1\/orders\/\d+\//))          return this._orderDetail(url);
    if (url.includes('/api/v2/orders/') && method === 'POST') return this._createOrder(body);
    if (url.includes('/api/v2/orders/'))               return this._orderList();

    // ─── Pagos ───────────────────────────────────────────────────
    if (url.includes('/api/v2/payments/mercadopago/create/')) return this._initMP(body);
    if (url.includes('/api/v2/payments/paypal/create/'))      return this._initPayPal(body);

    // ─── Wishlist ────────────────────────────────────────────────
    if (url.match(/\/api\/v1\/wishlist\/\d+\//) && method === 'DELETE') return this._removeWishlist(url);
    if (url.includes('/api/v2/wishlist/') && method === 'POST') return this._addWishlist(body);
    if (url.includes('/api/v2/wishlist/')) return this._getWishlist();

    // ─── Returns (D-007) ─────────────────────────────────────────
    const returnsResp = interceptReturns(url, options);
    if (returnsResp) return returnsResp;

    // ─── Inventory (D-007) ───────────────────────────────────────
    const inventoryResp = interceptInventory(url, options);
    if (inventoryResp) return inventoryResp;

    return this._notFound(url);
  }

  // ═══════ AUTH ═══════

  _login(body) {
    if (!body?.username || !body?.password) return this._error(400, 'Credenciales requeridas.');
    const isBuyer =
      (body.username === 'comprador@test.mx' ||
       body.username === 'testbuyer@example.com' ||
       body.username === 'buyer@e-commerce.test') &&
      body.password === 'Test1234!';
    if (isBuyer) {
      try { window.localStorage.setItem('_mock_auth_type', 'buyer'); } catch (e) {}
      return this._ok({ user: this._mockUser(1, false, 'testbuyer@example.com') });
    }
    const isAdmin =
      (body.username === 'admin@practicayoruba.mx' || body.username === 'testadmin@example.com') &&
      body.password === 'Admin1234!';
    if (isAdmin) {
      try { window.localStorage.setItem('_mock_auth_type', 'admin'); } catch (e) {}
      return this._ok({ user: this._mockUser(2, true, 'testadmin@example.com') });
    }
    return this._error(401, 'Credenciales inválidas.');
  }

  _logout() {
    try { window.localStorage.removeItem('_mock_auth_type'); } catch (e) {}
    return this._ok({ detail: 'Sesión cerrada.' });
  }

  _me() {
    let type = null;
    try { type = window.localStorage.getItem('_mock_auth_type'); } catch (e) {}
    if (type === 'admin') return this._ok(this._mockUser(2, true, 'testadmin@example.com'));
    if (type === 'buyer') return this._ok(this._mockUser(1, false, 'testbuyer@example.com'));
    return this._error(401, 'No autenticado.');
  }
  _register(body) {
    if (!body?.email || !body?.password) return this._error(400, 'Email y contraseña requeridos.');
    return { status: 201, data: { user: this._mockUser(99, false, body.email) } };
  }

  // DEC-AUM-04 (T-103 D-01-10): mock para POST /verify-email/<token>/.
  // Backend espera token en path; mock acepta cualquier path no vacio.
  _verifyEmail(url) {
    const m = url.match(/\/api\/v1\/auth\/verify-email\/([^/?]+)\/?/);
    if (!m || !m[1]) return this._error(400, 'Token requerido.');
    return this._ok({ verified: true, message: 'Email verificado correctamente.' });
  }

  // DEC-AUM-04 (T-103 D-02-10): mock para POST /resend-verification/.
  _resendVerification() {
    return this._ok({ sent: true, message: 'Correo de verificacion reenviado.' });
  }

  _changePassword(body) {
    if (!body?.current_password || !body?.new_password || !body?.new_password_confirm)
      return this._error(400, 'Campos requeridos: current_password, new_password, new_password_confirm.');
    if (body.new_password !== body.new_password_confirm)
      return this._error(400, 'Las contrasenas nuevas no coinciden.');
    if (body.current_password === 'wrong')
      return this._error(400, 'La contrasena actual es incorrecta.');
    return this._ok({ detail: 'Password changed successfully.' });
  }

  _mockUser(id, isStaff, email = 'comprador@test.mx') {
    return { id, email, first_name: 'Demo', last_name: 'Yoruba',
             is_staff: isStaff, date_joined: new Date().toISOString() };
  }

  // ═══════ CATÁLOGO ═══════

  _productList(url) {
    const qString = url.split('?')[1];
    const params  = new URL('http://mock' + (qString ? `?${qString}` : '')).searchParams;
    const page   = parseInt(params.get('page') || 1);
    const items  = this._generateProducts(20);
    return this._ok({ count: 143, results: items, next: page < 7 ? `?page=${page+1}` : null });
  }

  _productDetail(url) {
    const slug = url.split('/api/v2/catalogue/')[1].replace(/\//g, '');
    return this._ok(this._generateProduct(slug, 1));
  }

  _searchProducts(url) {
    const q = url.split('q=')[1]?.split('&')[0] || '';
    return this._ok({ count: 4, results: this._generateProducts(4, q) });
  }

  _categories() {
    return this._ok([
      { id: 1, name: 'Collares',   slug: 'collares',   product_count: 48 },
      { id: 2, name: 'Pulseras',   slug: 'pulseras',   product_count: 31 },
      { id: 3, name: 'Ofrendas',   slug: 'ofrendas',   product_count: 27 },
      { id: 4, name: 'Elekes',     slug: 'elekes',     product_count: 22 },
      { id: 5, name: 'Herramientas', slug: 'herramientas', product_count: 15 },
    ]);
  }

  _generateProducts(count, prefix = '') {
    const nombres = ['Collar Oshun', 'Pulsera Elegua', 'Collar Yemaya',
                     'Elekes Shango', 'Ofrenda Obatala', 'Collar Ogun',
                     'Pulsera Orula', 'Herramienta Oya', 'Collar Osain', 'Elekes Babalu'];
    return Array.from({ length: count }, (_, i) => this._generateProduct(
      `producto-${prefix}-${i + 1}`, i + 1
    ));
  }

  _generateProduct(slug, idx) {
    const nombres = ['Collar Oshun', 'Pulsera Elegua', 'Collar Yemaya',
                     'Elekes Shango', 'Ofrenda Obatala'];
    const precios = [350, 480, 1250, 890, 650, 920, 340, 1100, 560, 780];
    const i = (typeof idx === 'number' ? idx : 1) % precios.length;
    return {
      id: i + 1, slug: slug || `producto-${i}`,
      name: nombres[i % nombres.length],
      categories: [{ id: (i % 5) + 1, name: 'Collares', slug: 'collares' }],
      description: 'Elaborado a mano con cuentas auténticas siguiendo la tradición Yoruba.',
      price: precios[i], original_price: i % 3 === 0 ? precios[i] * 1.3 : null,
      stock: i % 4 === 0 ? 0 : Math.floor(Math.random() * 20) + 1,
      images: [{ id: 1, url: '/mock-images/product.jpg', is_main: true }],
      variants: [
        { id: 1, name: 'Talla única', sku: `SKU-${i}-01`, stock: 5, price: precios[i] },
      ],
      rating_avg: 4.5, review_count: Math.floor(Math.random() * 30),
    };
  }

  // ═══════ CARRITO ═══════

  _cartState = {
    items: [],
    voucher: null,
  };

  _getCart()   { return this._ok(this._buildCart()); }

  _addItem(body) {
    const { product_id, variant_id, quantity = 1 } = body || {};
    if (!product_id) return this._error(400, 'product_id requerido.');
    const exists = this._cartState.items.find(i => i.product_id === product_id);
    if (exists) {
      exists.quantity += quantity;
    } else {
      this._cartState.items.push({
        id: Date.now(), product_id, variant_id: variant_id || 1,
        name: `Producto Mock #${product_id}`, price: 480, quantity,
        image: '/mock-images/product.jpg',
      });
    }
    return this._ok(this._buildCart());
  }

  _updateItem(url, body) {
    const id  = parseInt(url.split('/api/v2/cart/items/')[1]);
    const item = this._cartState.items.find(i => i.id === id);
    if (!item) return this._error(404, 'Item no encontrado.');
    item.quantity = body?.quantity ?? item.quantity;
    return this._ok(this._buildCart());
  }

  _removeItem(url) {
    const id = parseInt(url.split('/api/v2/cart/items/')[1]);
    this._cartState.items = this._cartState.items.filter(i => i.id !== id);
    return this._ok(this._buildCart());
  }

  _applyVoucher(body) {
    const code = body?.code?.toUpperCase();
    const vouchers = {
      'YORUBA10': { code: 'YORUBA10', type: 'PERCENT', value: 10 },
      'DESCUENTO50': { code: 'DESCUENTO50', type: 'FIXED', value: 50 },
    };
    if (!vouchers[code]) return this._error(400, 'Voucher inválido o expirado.');
    this._cartState.voucher = vouchers[code];
    return this._ok(this._buildCart());
  }

  _removeVoucher() {
    this._cartState.voucher = null;
    return this._ok(this._buildCart());
  }

  _buildCart() {
    return { items: this._cartState.items, voucher: this._cartState.voucher };
  }

  // ═══════ ÓRDENES ═══════

  _orderList() {
    return this._ok({ count: 3, results: [
      this._mockOrder(1001, 'DELIVERED'),
      this._mockOrder(1002, 'SHIPPED'),
      this._mockOrder(1003, 'PENDING'),
    ]});
  }

  _orderDetail(url) {
    const id = parseInt(url.split('/api/v2/orders/')[1]);
    return this._ok(this._mockOrder(id || 1001, 'DELIVERED'));
  }

  _createOrder(body) {
    return { status: 201, data: this._mockOrder(Date.now(), 'PENDING', body) };
  }

  _cancelOrder(url) {
    const id = parseInt(url.split('/api/v2/orders/')[1]);
    return this._ok(this._mockOrder(id, 'CANCELLED'));
  }

  _mockOrder(id, status, body = {}) {
    return {
      id, status,
      total: 1250, subtotal: 1078, tax: 172, discount: 0,
      created_at: new Date().toISOString(),
      shipping_address: { street: 'Calle Reforma 42', city: 'CDMX', postal_code: '06600' },
      items: [{ id: 1, product_name: 'Collar Oshun', quantity: 2, price: 625 }],
    };
  }

  // ═══════ PAGOS ═══════

  _initMP(body) {
    return this._ok({
      preference_id: `TEST-${Date.now()}`,
      init_point: 'https://sandbox.mercadopago.com.mx/checkout/mock',
    });
  }

  _initPayPal(body) {
    return this._ok({
      order_id: `PAYPAL-MOCK-${Date.now()}`,
      approve_url: 'https://sandbox.paypal.com/checkoutnow/mock',
    });
  }

  // ═══════ DIRECCIONES (D-03-07) ═══════

  _addresses = [
    { id: 1, alias: 'Casa', street: 'Calle Reforma 42', city: 'Ciudad de Mexico',
      state: 'CDMX', postal_code: '06600', country: 'MX',
      exterior_number: '42', interior_number: '', neighborhood: 'Juarez',
      is_default: true },
  ];

  _listAddresses() {
    return this._ok(this._addresses);
  }

  _createAddress(body) {
    if (!body?.street || !body?.city || !body?.postal_code)
      return this._error(400, 'Campos requeridos: street, city, postal_code.');
    const addr = { id: Date.now(), is_default: this._addresses.length === 0,
                   exterior_number: '', interior_number: '', neighborhood: '',
                   ...body };
    this._addresses.push(addr);
    return { status: 201, data: addr };
  }

  _updateAddress(url, body) {
    const id   = parseInt(url.match(/\/addresses\/(\d+)\//)?.[1]);
    const addr = this._addresses.find(a => a.id === id);
    if (!addr) return this._error(404, 'Direccion no encontrada.');
    Object.assign(addr, body);
    return this._ok(addr);
  }

  _deleteAddress(url) {
    const id = parseInt(url.match(/\/addresses\/(\d+)\//)?.[1]);
    const idx = this._addresses.findIndex(a => a.id === id);
    if (idx === -1) return this._error(404, 'Direccion no encontrada.');
    const wasDefault = this._addresses[idx].is_default;
    this._addresses.splice(idx, 1);
    if (wasDefault && this._addresses.length > 0)
      this._addresses[0].is_default = true;
    return { status: 204, data: null };
  }

  _setDefaultAddress(url) {
    const id   = parseInt(url.match(/\/addresses\/(\d+)\//)?.[1]);
    const addr = this._addresses.find(a => a.id === id);
    if (!addr) return this._error(404, 'Direccion no encontrada.');
    this._addresses.forEach(a => { a.is_default = a.id === id; });
    return this._ok(addr);
  }

  // ═══════ WISHLIST ═══════
  _wishlist = [];

  _getWishlist()    { return this._ok(this._wishlist); }
  _addWishlist(body) {
    const item = { id: Date.now(), product_id: body?.product_id,
                   product_name: 'Producto Mock', price: 480 };
    this._wishlist.push(item);
    return { status: 201, data: item };
  }
  _removeWishlist(url) {
    const pid = parseInt(url.split('/api/v2/wishlist/')[1]);
    this._wishlist = this._wishlist.filter(i => i.product_id !== pid);
    return { status: 204, data: null };
  }

  // ═══════ Helpers ═══════

  _ok(data, status = 200)    { return { status, data }; }
  _error(status, msg)        { return { status, data: { detail: msg } }; }
  _notFound(url)             { return this._error(404, `Mock no registrado: ${url}`); }
  _delay(ms)                 { return new Promise(r => setTimeout(r, ms)); }

  _sanitize(data) {
    if (!data || typeof data !== 'object') return data;
    const s = { ...data };
    for (const f of SENSITIVE_FIELDS) {
      if (f in s) s[f] = '[REDACTED]';
    }
    return s;
  }
}

const mockInterceptor = new MockInterceptor();
export default mockInterceptor;
export { MockInterceptor };
