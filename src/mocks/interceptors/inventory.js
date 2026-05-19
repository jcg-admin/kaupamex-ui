/**
 * Inventory mock interceptor — PracticaYoruba (D-007).
 *
 * Cubre UC-INV-01..05 sobre los endpoints:
 *   GET    /api/v1/admin/inventory/
 *   GET    /api/v1/admin/inventory/variants/<id>/movements/
 *   POST   /api/v1/admin/inventory/variants/<id>/adjust/
 *   POST   /api/v1/admin/inventory/import/
 *
 * Contrato:
 *   - JSON keys en ingles (DEC-DOC-005).
 *   - Estados de stock: NORMAL | BAJO | AGOTADO.
 *   - Tipos de movimiento: SALE | CANCELLATION | MANUAL.
 *   - Status codes consistentes con apiService (200/201/400/404/409).
 */

const STOCK_PREFIX     = '/api/v1/admin/inventory/';
const VARIANTS_PREFIX  = '/api/v1/admin/inventory/variants/';
const IMPORT_PREFIX    = '/api/v1/admin/inventory/import/';

const ok       = (data, status = 200) => ({ status, data });
const created  = (data)               => ({ status: 201, data });
const error    = (status, detail)     => ({ status, data: { detail } });

function classify(stock, threshold) {
  if (stock <= 0)                return 'AGOTADO';
  if (stock <= (threshold ?? 0)) return 'BAJO';
  return 'NORMAL';
}

const state = {
  items: [
    { variant_id: 1, sku: 'OSHU-CH', product_name: 'Collar Oshun', stock: 8,  min_threshold: 3 },
    { variant_id: 2, sku: 'OSHU-MD', product_name: 'Collar Oshun', stock: 2,  min_threshold: 3 },
    { variant_id: 3, sku: 'YEMA-CH', product_name: 'Elekes Yemaya', stock: 0, min_threshold: 2 },
    { variant_id: 4, sku: 'ELE-OB',  product_name: 'Elekes Obatala', stock: 12, min_threshold: 4 },
  ],
  movements: {
    1: [
      { id: 1, type: 'SALE',        delta: -1, reason: 'Venta #1001', created_at: '2026-05-01T10:00:00Z' },
      { id: 2, type: 'MANUAL',      delta:  3, reason: 'CONTEO_FISICO', created_at: '2026-05-10T12:00:00Z' },
    ],
    2: [
      { id: 3, type: 'CANCELLATION', delta:  1, reason: 'Cancelación #1003', created_at: '2026-05-11T08:30:00Z' },
    ],
  },
  importReports: [],
};

function summary() {
  return {
    productos_normales:   state.items.filter((i) => classify(i.stock, i.min_threshold) === 'NORMAL').length,
    productos_bajo_stock: state.items.filter((i) => classify(i.stock, i.min_threshold) === 'BAJO').length,
    productos_agotados:   state.items.filter((i) => classify(i.stock, i.min_threshold) === 'AGOTADO').length,
  };
}

function decorate(item) {
  return { ...item, status: classify(item.stock, item.min_threshold) };
}

function variantIdFromMovements(url) {
  const m = url.split('?')[0].match(/^\/api\/v1\/admin\/inventory\/variants\/(\d+)\/movements\/$/);
  return m ? Number(m[1]) : null;
}

function variantIdFromAdjust(url) {
  const m = url.split('?')[0].match(/^\/api\/v1\/admin\/inventory\/variants\/(\d+)\/adjust\/$/);
  return m ? Number(m[1]) : null;
}

export function interceptInventory(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let body = null;
  if (options.body && !(options.body instanceof FormData)) {
    try { body = JSON.parse(options.body); } catch { body = null; }
  }

  if (url.startsWith(IMPORT_PREFIX) && method === 'POST') {
    const report = {
      id:           state.importReports.length + 1,
      created:      3,
      updated:      2,
      errors:       0,
      error_report: null,
      download_url: null,
    };
    state.importReports.push(report);
    return created(report);
  }

  const variantMovementsId = variantIdFromMovements(url);
  if (variantMovementsId !== null) {
    if (method !== 'GET') return error(405, 'Método no permitido.');
    const movs = state.movements[variantMovementsId] ?? [];
    return ok({ count: movs.length, results: movs });
  }

  const adjustId = variantIdFromAdjust(url);
  if (adjustId !== null && method === 'POST') {
    const item = state.items.find((i) => i.variant_id === adjustId);
    if (!item) return error(404, 'Variante no encontrada.');
    const newQty = body?.new_quantity;
    if (typeof newQty !== 'number' || Number.isNaN(newQty)) {
      return error(400, 'new_quantity numérico es obligatorio.');
    }
    if (newQty < 0) {
      return error(409, 'STOCK_NEGATIVO_NO_PERMITIDO');
    }
    if (!body?.reason) {
      return error(400, 'reason es obligatorio.');
    }
    const delta = newQty - item.stock;
    item.stock  = newQty;
    state.movements[adjustId] = state.movements[adjustId] ?? [];
    const mov = {
      id:         (state.movements[adjustId].length + 1) * 100 + adjustId,
      type:       'MANUAL',
      delta,
      reason:     body.reason,
      observations: body.observations ?? '',
      created_at: new Date().toISOString(),
    };
    state.movements[adjustId].push(mov);
    return ok({
      variant_id: adjustId,
      new_stock:  newQty,
      movement:   mov,
    });
  }

  if (url.split('?')[0] === STOCK_PREFIX && method === 'GET') {
    return ok({
      count:   state.items.length,
      results: state.items.map(decorate),
      summary: summary(),
    });
  }

  if (url.startsWith(STOCK_PREFIX)) {
    return error(404, `Endpoint de inventario no soportado: ${method} ${url}`);
  }

  return null;
}

export const __inventoryState = state;
export const __resetInventoryState = () => {
  state.items = [
    { variant_id: 1, sku: 'OSHU-CH', product_name: 'Collar Oshun', stock: 8,  min_threshold: 3 },
    { variant_id: 2, sku: 'OSHU-MD', product_name: 'Collar Oshun', stock: 2,  min_threshold: 3 },
    { variant_id: 3, sku: 'YEMA-CH', product_name: 'Elekes Yemaya', stock: 0, min_threshold: 2 },
    { variant_id: 4, sku: 'ELE-OB',  product_name: 'Elekes Obatala', stock: 12, min_threshold: 4 },
  ];
  state.movements = {
    1: [
      { id: 1, type: 'SALE',   delta: -1, reason: 'Venta #1001', created_at: '2026-05-01T10:00:00Z' },
      { id: 2, type: 'MANUAL', delta:  3, reason: 'CONTEO_FISICO', created_at: '2026-05-10T12:00:00Z' },
    ],
    2: [
      { id: 3, type: 'CANCELLATION', delta: 1, reason: 'Cancelación #1003', created_at: '2026-05-11T08:30:00Z' },
    ],
  };
  state.importReports = [];
};

export default interceptInventory;
