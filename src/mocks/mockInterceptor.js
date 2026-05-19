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
 *   Auth:      /api/auth/*, /api/token/
 *   Catalog:   /api/products/*, /api/categories/*
 *   Cart:      /api/cart/*
 *   Orders:    /api/orders/*
 *   Checkout:  /api/payments/*
 *   Wishlist:  /api/wishlist/*
 *   Returns:   /api/v1/returns/*, /api/v1/admin/returns/*   (D-007)
 *   Inventory: /api/v1/admin/inventory/*                    (D-007)
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
    const body   = options.body ? JSON.parse(options.body) : null;

    if (process.env.NODE_ENV !== 'development') return null;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[MOCK] ${method} ${url}`, this._sanitize(body));
    }

    await this._delay(this.delay);

    // ─── Auth ───────────────────────────────────────────────────
    if (url.includes('/api/token/'))         return this._login(body);
    if (url.includes('/api/auth/logout/'))   return this._logout();
    if (url.includes('/api/auth/me/'))       return this._me();
    if (url.includes('/api/auth/register/')) return this._register(body);

    // ─── Catálogo ────────────────────────────────────────────────
    if (url.includes('/api/products/search/')) return this._searchProducts(url);
    if (url.match(/\/api\/products\/[^/]+\//)) return this._productDetail(url);
    if (url.includes('/api/products/'))        return this._productList(url);
    if (url.includes('/api/categories/'))      return this._categories();

    // ─── Carrito ─────────────────────────────────────────────────
    if (url.includes('/api/cart/voucher/') && method === 'POST')   return this._applyVoucher(body);
    if (url.includes('/api/cart/voucher/') && method === 'DELETE') return this._removeVoucher();
    if (url.match(/\/api\/cart\/items\/\d+\//) && method === 'PATCH')  return this._updateItem(url, body);
    if (url.match(/\/api\/cart\/items\/\d+\//) && method === 'DELETE') return this._removeItem(url);
    if (url.includes('/api/cart/items/') && method === 'POST') return this._addItem(body);
    if (url.includes('/api/cart/'))            return this._getCart();

    // ─── Órdenes ─────────────────────────────────────────────────
    if (url.match(/\/api\/orders\/\d+\/cancel\//)) return this._cancelOrder(url);
    if (url.match(/\/api\/orders\/\d+\//))          return this._orderDetail(url);
    if (url.includes('/api/orders/') && method === 'POST') return this._createOrder(body);
    if (url.includes('/api/orders/'))               return this._orderList();

    // ─── Pagos ───────────────────────────────────────────────────
    if (url.includes('/api/payments/mercadopago/create/')) return this._initMP(body);
    if (url.includes('/api/payments/paypal/create/'))      return this._initPayPal(body);

    // ─── Wishlist ────────────────────────────────────────────────
    if (url.match(/\/api\/wishlist\/\d+\//) && method === 'DELETE') return this._removeWishlist(url);
    if (url.includes('/api/wishlist/') && method === 'POST') return this._addWishlist(body);
    if (url.includes('/api/wishlist/')) return this._getWishlist();

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
    if (body.username === 'comprador@test.mx' && body.password === 'Test1234!') {
      return this._ok({ user: this._mockUser(1, false) });
    }
    if (body.username === 'admin@practicayoruba.mx' && body.password === 'Admin1234!') {
      return this._ok({ user: this._mockUser(2, true) });
    }
    return this._error(401, 'Credenciales inválidas.');
  }

  _logout()   { return this._ok({ detail: 'Sesión cerrada.' }); }
  _me()       { return this._ok(this._mockUser(1, false)); }
  _register(body) {
    if (!body?.email || !body?.password) return this._error(400, 'Email y contraseña requeridos.');
    return { status: 201, data: { user: this._mockUser(99, false, body.email) } };
  }

  _mockUser(id, isStaff, email = 'comprador@test.mx') {
    return { id, email, first_name: 'Demo', last_name: 'Yoruba',
             is_staff: isStaff, date_joined: new Date().toISOString() };
  }

  // ═══════ CATÁLOGO ═══════

  _productList(url) {
    const params = new URL('http://mock' + url.split('?')[1] ? `?${url.split('?')[1]}` : '').searchParams;
    const page   = parseInt(params.get('page') || 1);
    const items  = this._generateProducts(20);
    return this._ok({ count: 143, results: items, next: page < 7 ? `?page=${page+1}` : null });
  }

  _productDetail(url) {
    const slug = url.split('/api/products/')[1].replace(/\//g, '');
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
      category: { id: (i % 5) + 1, name: 'Collares', slug: 'collares' },
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
    const id  = parseInt(url.split('/api/cart/items/')[1]);
    const item = this._cartState.items.find(i => i.id === id);
    if (!item) return this._error(404, 'Item no encontrado.');
    item.quantity = body?.quantity ?? item.quantity;
    return this._ok(this._buildCart());
  }

  _removeItem(url) {
    const id = parseInt(url.split('/api/cart/items/')[1]);
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
    const id = parseInt(url.split('/api/orders/')[1]);
    return this._ok(this._mockOrder(id || 1001, 'DELIVERED'));
  }

  _createOrder(body) {
    return { status: 201, data: this._mockOrder(Date.now(), 'PENDING', body) };
  }

  _cancelOrder(url) {
    const id = parseInt(url.split('/api/orders/')[1]);
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
    const pid = parseInt(url.split('/api/wishlist/')[1]);
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
