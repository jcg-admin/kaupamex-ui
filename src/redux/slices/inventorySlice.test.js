/**
 * Tests unitarios — inventorySlice
 * UC-INV-01..05
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';
import inventoryReducer, {
  fetchInventory,
  fetchStockMovements,
  adjustStockManually,
  importProductsCsv,
  clearInventoryActionState,
  clearImportReport,
} from './inventorySlice';

const makeStore = () =>
  configureStore({ reducer: { inventory: inventoryReducer } });

const ITEM = {
  variant_id: 10, product_id: 1, product_name: 'Vela Yoruba',
  sku: 'SKU-001', stock: 3, min_threshold: 5, status: 'BAJO',
};

afterEach(() => jest.clearAllMocks());

describe('inventorySlice — fetchInventory (UC-INV-01)', () => {
  it('fulfilled — hidrata items y summary', async () => {
    apiService.get.mockResolvedValue({
      data: {
        results: [ITEM],
        summary: { productos_normales: 0, productos_bajo_stock: 1, productos_agotados: 0 },
      },
    });
    const store = makeStore();
    await store.dispatch(fetchInventory({ status: 'BAJO' }));
    const s = store.getState().inventory;
    expect(s.items).toHaveLength(1);
    expect(s.items[0].sku).toBe('SKU-001');
    expect(s.summary.productos_bajo_stock).toBe(1);
    expect(s.isLoading).toBe(false);
  });

  it('rejected — guarda error', async () => {
    apiService.get.mockRejectedValue(new Error('Network'));
    const store = makeStore();
    await store.dispatch(fetchInventory());
    expect(store.getState().inventory.error).toBeDefined();
  });

  it('llama a la URL admin con params', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    const store = makeStore();
    await store.dispatch(fetchInventory({ status: 'AGOTADO' }));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/inventory/',
      { params: { status: 'AGOTADO' } },
    );
  });
});

describe('inventorySlice — fetchStockMovements (UC-INV-02/03)', () => {
  it('fulfilled — pobla movements', async () => {
    apiService.get.mockResolvedValue({
      data: { results: [
        { id: 1, type: 'SALE',         delta: -2, stock_after: 3 },
        { id: 2, type: 'CANCELLATION', delta:  2, stock_after: 5 },
      ] },
    });
    const store = makeStore();
    await store.dispatch(fetchStockMovements(10));
    const s = store.getState().inventory;
    expect(s.movements).toHaveLength(2);
    expect(s.movements[0].type).toBe('SALE');
  });

  it('llama a la URL de movimientos por variante', async () => {
    apiService.get.mockResolvedValue({ data: { results: [] } });
    const store = makeStore();
    await store.dispatch(fetchStockMovements(99));
    expect(apiService.get).toHaveBeenCalledWith(
      '/api/v1/admin/inventory/variants/99/movements/',
    );
  });
});

describe('inventorySlice — adjustStockManually (UC-INV-04)', () => {
  it('fulfilled — marca lastAction y aplica el nuevo stock al item', async () => {
    apiService.post.mockResolvedValue({
      data: { variant_id: 10, new_stock: 25, previous_stock: 3, delta: 22, movement_id: 99 },
    });
    const store = makeStore();
    // seed
    store.dispatch({ type: 'inventory/fetchInventory/fulfilled',
                     payload: { results: [ITEM] } });
    await store.dispatch(adjustStockManually({
      variantId: 10, newQuantity: 25, reason: 'CONTEO_FISICO',
    }));
    const s = store.getState().inventory;
    expect(s.lastAction).toBe('adjusted');
    expect(s.items[0].stock).toBe(25);
    expect(s.isActioning).toBe(false);
  });

  it('rejected — guarda actionError', async () => {
    apiService.post.mockRejectedValue({
      body: { detail: 'STOCK_NEGATIVO_NO_PERMITIDO' }, message: '422',
    });
    const store = makeStore();
    await store.dispatch(adjustStockManually({
      variantId: 10, newQuantity: -1, reason: 'MERMA',
    }));
    expect(store.getState().inventory.actionError).toMatchObject({
      message: 'STOCK_NEGATIVO_NO_PERMITIDO',
    });
  });

  it('clearInventoryActionState limpia el error', () => {
    const store = makeStore();
    store.dispatch({ type: 'inventory/adjustStock/rejected', payload: 'X' });
    store.dispatch(clearInventoryActionState());
    expect(store.getState().inventory.actionError).toBeNull();
    expect(store.getState().inventory.lastAction).toBeNull();
  });
});

describe('inventorySlice — importProductsCsv (UC-INV-05)', () => {
  it('fulfilled — guarda importReport y lastAction=imported', async () => {
    apiService.post.mockResolvedValue({
      data: {
        products_created: 8, products_failed: 2,
        error_report: [{ row: 3, field: 'sku', reason: 'duplicado' }],
        download_url: '/media/reports/import-123.csv',
      },
    });
    const store = makeStore();
    const file = new File(['sku,name'], 'p.csv', { type: 'text/csv' });
    await store.dispatch(importProductsCsv({ file }));
    const s = store.getState().inventory;
    expect(s.lastAction).toBe('imported');
    expect(s.importReport.products_created).toBe(8);
    expect(s.importReport.products_failed).toBe(2);
  });

  it('rejected — guarda actionError', async () => {
    apiService.post.mockRejectedValue({
      body: { detail: 'ENCABEZADO_CSV_INVALIDO' }, message: '422',
    });
    const store = makeStore();
    const file = new File([''], 'bad.csv', { type: 'text/csv' });
    await store.dispatch(importProductsCsv({ file }));
    expect(store.getState().inventory.actionError).toMatchObject({
      message: 'ENCABEZADO_CSV_INVALIDO',
    });
  });

  it('clearImportReport limpia el reporte', () => {
    const store = makeStore();
    store.dispatch({ type: 'inventory/importCsv/fulfilled',
                     payload: { products_created: 1 } });
    store.dispatch(clearImportReport());
    expect(store.getState().inventory.importReport).toBeNull();
  });
});
