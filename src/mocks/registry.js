/**
 * Mock Registry — PracticaYoruba
 *
 * Registro central de todos los mocks por dominio.
 * Cada dominio tiene su loader y su validador de esquema.
 *
 * Uso en createResilientService:
 *   const service = createResilientService({
 *     id: 'catalog',
 *     endpoint: '/api/products/',
 *     mockDataLoader: () => loadMock('catalog'),
 *     shouldUseMock: () => process.env.PY_CATALOG_SOURCE === 'mock',
 *   });
 */

// ─── Loaders inline ───────────────────────────────────────────────────
// Los datos mock se definen aquí directamente para el MVP.
// En proyectos mayores se pueden mover a archivos JSON separados.

const MOCKS = {
  auth: {
    data: {
      user: { id: 1, email: 'comprador@test.mx', first_name: 'Demo',
              last_name: 'Yoruba', is_staff: false }
    },
    validate: (d) => d && d.user,
    description: 'Datos de sesión del comprador mock',
  },

  catalog: {
    data: {
      count: 6, results: [
        { id: 1, slug: 'collar-oshun',      name: 'Collar Oshun',       price: 1250, stock: 8, category: { slug: 'collares' } },
        { id: 2, slug: 'pulsera-elegua',    name: 'Pulsera Elegua',     price: 480,  stock: 12, category: { slug: 'pulseras' } },
        { id: 3, slug: 'elekes-yemaya',     name: 'Elekes Yemaya',      price: 890,  stock: 0, category: { slug: 'elekes' } },
        { id: 4, slug: 'collar-shango',     name: 'Collar Shango',      price: 1100, stock: 5, category: { slug: 'collares' } },
        { id: 5, slug: 'ofrenda-obatala',   name: 'Ofrenda Obatalá',    price: 650,  stock: 3, category: { slug: 'ofrendas' } },
        { id: 6, slug: 'herramienta-ogun',  name: 'Herramienta Ogun',   price: 780,  stock: 7, category: { slug: 'herramientas' } },
      ],
    },
    validate: (d) => d && Array.isArray(d.results),
    description: 'Listado de productos del catálogo',
  },

  categories: {
    data: [
      { id: 1, name: 'Collares',     slug: 'collares',     product_count: 48 },
      { id: 2, name: 'Pulseras',     slug: 'pulseras',     product_count: 31 },
      { id: 3, name: 'Ofrendas',     slug: 'ofrendas',     product_count: 27 },
      { id: 4, name: 'Elekes',       slug: 'elekes',       product_count: 22 },
      { id: 5, name: 'Herramientas', slug: 'herramientas', product_count: 15 },
    ],
    validate: (d) => Array.isArray(d),
    description: 'Árbol de categorías',
  },

  cart: {
    data: { items: [], voucher: null },
    validate: (d) => d && Array.isArray(d.items),
    description: 'Carrito vacío inicial',
  },

  orders: {
    data: {
      count: 2,
      results: [
        { id: 1001, status: 'DELIVERED', total: 1730, created_at: '2026-04-15T10:30:00Z',
          items: [{ product_name: 'Collar Oshun', quantity: 1, price: 1250 }] },
        { id: 1002, status: 'SHIPPED',   total: 960,  created_at: '2026-05-01T14:20:00Z',
          items: [{ product_name: 'Pulsera Elegua', quantity: 2, price: 480 }] },
      ],
    },
    validate: (d) => d && Array.isArray(d.results),
    description: 'Historial de órdenes del comprador mock',
  },


  profile: {
    data: {
      id: 1,
      username: 'comprador_demo',
      email: 'comprador@test.mx',
      first_name: 'Demo',
      last_name: 'Yoruba',
      phone: '5551234567',
      avatar_url: null,
      date_joined: '2026-01-15T08:00:00Z',
      profile_completeness: 60,
      pending_fields: ['avatar', 'addresses'],
    },
    validate: (d) => d && d.username,
    description: 'Perfil del comprador mock (UC-AUTH-05)',
  },

  addresses: {
    data: [
      {
        id: 1,
        alias: 'Casa',
        recipient_name: 'Demo Yoruba',
        street: 'Insurgentes Sur 1234 Int 5',
        city: 'Ciudad de Mexico',
        state: 'CDMX',
        zip_code: '03100',
        country: 'MX',
        phone: '5551234567',
        is_default: true,
      },
    ],
    validate: (d) => Array.isArray(d),
    description: 'Direcciones de envio del comprador mock (UC-AUTH-07)',
  },

  wishlist: {
    data: [
      { id: 1, product_id: 1, product_name: 'Collar Oshun', price: 1250 },
    ],
    validate: (d) => Array.isArray(d),
    description: 'Lista de deseos mock',
  },
};

// ─── API pública ──────────────────────────────────────────────────────

/**
 * Carga un mock por clave.
 * @param {string} key — clave del dominio (e.g. 'catalog', 'cart')
 * @returns {any} datos mock clonados
 */
export const loadMock = (key) => {
  const entry = MOCKS[key];
  if (!entry) throw new Error(`[MockRegistry] Mock '${key}' no registrado.`);
  return JSON.parse(JSON.stringify(entry.data)); // deep clone
};

/**
 * Valida los datos de un mock.
 */
export const validateMock = (key, data) => {
  const entry = MOCKS[key];
  if (!entry) throw new Error(`[MockRegistry] Mock '${key}' no registrado.`);
  return entry.validate(data);
};

/**
 * Devuelve todas las claves registradas.
 */
export const listMocks = () => Object.keys(MOCKS);

/**
 * Devuelve la descripción de un mock (útil para debugging).
 */
export const describeMock = (key) => MOCKS[key]?.description ?? 'Sin descripción.';

export default { loadMock, validateMock, listMocks, describeMock };
