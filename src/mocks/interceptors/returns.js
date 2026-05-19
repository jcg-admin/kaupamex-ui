/**
 * Returns mock interceptor — PracticaYoruba (D-007).
 *
 * Cubre UC-RET-01..06 sobre los endpoints:
 *   /api/v1/returns/             (comprador: listar, detalle, crear)
 *   /api/v1/admin/returns/       (admin: bandeja, detalle, acciones)
 *
 * El interceptor responde como el contrato real:
 *   - JSON keys en ingles (DEC-DOC-005).
 *   - Status codes consistentes con apiService (200/201/204/400/404/409).
 *   - Mensajes de error en `detail` (en espanol — texto del dominio).
 *
 * Se monta dinamicamente desde mockInterceptor.js cuando NODE_ENV es
 * development. El estado vive en memoria para que el flujo de admin
 * sea coherente entre pantallas (aprobar -> aparecer en bandeja).
 */

const CUSTOMER_PREFIX = '/api/v1/returns/';
const ADMIN_PREFIX    = '/api/v1/admin/returns/';

const ok       = (data, status = 200) => ({ status, data });
const created  = (data)               => ({ status: 201, data });
const noContent = ()                  => ({ status: 204, data: null });
const error    = (status, detail)     => ({ status, data: { detail } });

function buildSeedReturn(id, overrides = {}) {
  return {
    id,
    order_id:    `ORD-${1000 + id}`,
    customer:    { name: 'Demo Yoruba', email: 'comprador@test.mx' },
    reason:      'DAMAGED_ON_ARRIVAL',
    description: 'Llegó dañado en la caja externa.',
    status:      'PENDIENTE_REVISION',
    items:       [
      { id: 1, product_name: 'Collar Oshun', quantity: 1, price: 1250 },
    ],
    history:  [{ id: 1, status: 'PENDIENTE_REVISION', created_at: new Date().toISOString() }],
    refund:   null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

const state = {
  items: [
    buildSeedReturn(1),
    buildSeedReturn(2, { status: 'APROBADA' }),
    buildSeedReturn(3, { status: 'PENDIENTE_INFORMACION' }),
  ],
  nextId: 4,
};

function findById(id) {
  return state.items.find((r) => r.id === Number(id));
}

function applyUpdate(id, updater) {
  const idx = state.items.findIndex((r) => r.id === Number(id));
  if (idx === -1) return null;
  const next = { ...state.items[idx], ...updater(state.items[idx]) };
  state.items[idx] = next;
  return next;
}

function metrics() {
  return {
    pendientes:     state.items.filter((r) => r.status === 'PENDIENTE_REVISION').length,
    aprobadas:      state.items.filter((r) => r.status === 'APROBADA').length,
    pendiente_info: state.items.filter((r) => r.status === 'PENDIENTE_INFORMACION').length,
  };
}

function listMatches(url) {
  const stripped = url.split('?')[0];
  return stripped === CUSTOMER_PREFIX || stripped === ADMIN_PREFIX;
}

function detailMatches(url, prefix) {
  const m = url.split('?')[0].match(new RegExp(`^${prefix}(\\d+)/$`));
  return m ? m[1] : null;
}

function actionMatches(url, prefix) {
  const m = url.split('?')[0].match(
    new RegExp(`^${prefix}(\\d+)/(approve|reject|request-info|reception|refund)/$`),
  );
  return m ? { id: Number(m[1]), action: m[2] } : null;
}

/**
 * @returns {{status:number,data:any}|null} respuesta mock o null si no aplica.
 */
export function interceptReturns(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body   = options.body ? JSON.parse(options.body) : null;

  // ---- Cliente: lista / detalle / creacion ---------------------------
  if (url.startsWith(CUSTOMER_PREFIX)) {
    if (method === 'GET' && url.split('?')[0] === CUSTOMER_PREFIX) {
      return ok({ count: state.items.length, results: state.items });
    }
    const idDetail = detailMatches(url, CUSTOMER_PREFIX);
    if (idDetail && method === 'GET') {
      const item = findById(idDetail);
      return item ? ok(item) : error(404, 'Devolución no encontrada.');
    }
    if (method === 'POST' && url.split('?')[0] === CUSTOMER_PREFIX) {
      if (!body?.order_id || !body?.reason) {
        return error(400, 'order_id y reason son obligatorios.');
      }
      const created_obj = buildSeedReturn(state.nextId++, {
        order_id:    body.order_id,
        reason:      body.reason,
        description: body.description ?? '',
        status:      'PENDIENTE_REVISION',
      });
      state.items.unshift(created_obj);
      return created(created_obj);
    }
  }

  // ---- Admin: bandeja / detalle / acciones ---------------------------
  if (url.startsWith(ADMIN_PREFIX)) {
    if (method === 'GET' && url.split('?')[0] === ADMIN_PREFIX) {
      return ok({
        count:   state.items.length,
        results: state.items,
        metrics: metrics(),
      });
    }
    const idDetail = detailMatches(url, ADMIN_PREFIX);
    if (idDetail && method === 'GET') {
      const item = findById(idDetail);
      return item ? ok(item) : error(404, 'Devolución no encontrada.');
    }
    const act = actionMatches(url, ADMIN_PREFIX);
    if (act && method === 'POST') {
      const item = findById(act.id);
      if (!item) return error(404, 'Devolución no encontrada.');
      switch (act.action) {
        case 'approve':
          return ok(applyUpdate(act.id, () => ({ status: 'APROBADA' })));
        case 'reject':
          if (!body?.justification) {
            return error(400, 'justification es obligatoria.');
          }
          return ok(applyUpdate(act.id, () => ({
            status:           'RECHAZADA',
            rejection_reason: body.justification,
          })));
        case 'request-info':
          if (!body?.message) {
            return error(400, 'message es obligatorio.');
          }
          return ok(applyUpdate(act.id, () => ({ status: 'PENDIENTE_INFORMACION' })));
        case 'reception':
          if (!body?.product_condition) {
            return error(400, 'product_condition es obligatorio.');
          }
          return ok(applyUpdate(act.id, () => ({
            status:            'RECIBIDA',
            product_condition: body.product_condition,
          })));
        case 'refund':
          if (item.status !== 'RECIBIDA' && item.status !== 'COMPLETADA') {
            return error(409, 'La devolución debe estar recibida antes de reembolsar.');
          }
          return ok(applyUpdate(act.id, () => ({
            status: 'REEMBOLSADA',
            refund: { status: 'COMPLETED', amount: body?.amount ?? 0 },
          })));
        default:
          return error(404, 'Acción desconocida.');
      }
    }
  }

  if (listMatches(url) || url.startsWith(CUSTOMER_PREFIX) || url.startsWith(ADMIN_PREFIX)) {
    if (method === 'OPTIONS') return noContent();
    return error(404, `Endpoint de devoluciones no soportado: ${method} ${url}`);
  }

  return null;
}

// Exportados solo para tests / depuracion.
export const __returnsState = state;
export const __resetReturnsState = () => {
  state.items  = [
    buildSeedReturn(1),
    buildSeedReturn(2, { status: 'APROBADA' }),
    buildSeedReturn(3, { status: 'PENDIENTE_INFORMACION' }),
  ];
  state.nextId = 4;
};

export default interceptReturns;
