/**
 * Tests de contrato — paymentsSlice (PG-01).
 *
 * Verifican que los thunks de la pasarela mapean las respuestas del backend al
 * estado según los contratos documentados en analisis-pasarela.md:
 *   - tarjeta (Checkout API): status/status_detail
 *   - no-tarjeta (OXXO/SPEI): external_resource_url, date_of_expiration,
 *     transaction_data.clabe
 *   - errores: AMOUNT_MISMATCH (422), ORDER_NOT_PAYABLE (400)
 */
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';

import paymentsReducer, {
  initiateCheckoutApiPayment,
  initiateNonCardPayment,
  retryPayment,
  requestAdminRefund,
  clearPaymentsActionState,
} from './paymentsSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';
const INITIATE = `${BASE}/api/v2/payments/initiate/`;

const makeStore = () =>
  configureStore({ reducer: { payments: paymentsReducer } });

describe('paymentsSlice — contratos (PG-01)', () => {
  it('tarjeta aprobada: mapea status/status_detail y marca gateway mercadopago', async () => {
    server.use(
      http.post(INITIATE, () =>
        HttpResponse.json({
          gateway_payment_id: '1312345678',
          status: 'approved',
          status_detail: 'accredited',
          order_number: 'PY-24815',
          amount: '3439.60',
          installments: 3,
        }),
      ),
    );
    const store = makeStore();
    await store.dispatch(
      initiateCheckoutApiPayment({ order_number: 'PY-24815', token: 'tok', payment_method_id: 'visa' }),
    );
    const s = store.getState().payments;
    expect(s.lastAction).toBe('mp_checkout_api');
    expect(s.lastInitiation).toMatchObject({
      gateway: 'mercadopago',
      status: 'approved',
      status_detail: 'accredited',
      installments: 3,
    });
    expect(s.actionError).toBeNull();
  });

  it('OXXO pendiente: conserva external_resource_url y date_of_expiration', async () => {
    server.use(
      http.post(INITIATE, () =>
        HttpResponse.json({
          gateway_payment_id: 'mp-oxxo-1',
          status: 'pending',
          status_detail: 'pending_waiting_payment',
          order_number: 'PY-24815',
          external_resource_url: 'https://mp.com/voucher/oxxo/abc',
          date_of_expiration: '2026-07-07T01:59:59.000-04:00',
          transaction_data: null,
        }),
      ),
    );
    const store = makeStore();
    await store.dispatch(
      initiateNonCardPayment({ order_number: 'PY-24815', payment_method_id: 'oxxo' }),
    );
    const s = store.getState().payments;
    expect(s.lastAction).toBe('mp_non_card');
    expect(s.lastInitiation.status).toBe('pending');
    expect(s.lastInitiation.external_resource_url).toMatch(/voucher\/oxxo/);
    expect(s.lastInitiation.date_of_expiration).toBeTruthy();
  });

  it('SPEI pendiente: conserva transaction_data.clabe', async () => {
    server.use(
      http.post(INITIATE, () =>
        HttpResponse.json({
          gateway_payment_id: 'mp-spei-1',
          status: 'pending',
          status_detail: 'pending_waiting_transfer',
          order_number: 'PY-24815',
          transaction_data: { clabe: '646180123456789012' },
          date_of_expiration: '2026-07-07T01:59:59.000-04:00',
        }),
      ),
    );
    const store = makeStore();
    await store.dispatch(
      initiateNonCardPayment({ order_number: 'PY-24815', payment_method_id: 'clabe' }),
    );
    const s = store.getState().payments;
    expect(s.lastInitiation.transaction_data.clabe).toBe('646180123456789012');
  });

  it('422 AMOUNT_MISMATCH: registra actionError con statusCode 422', async () => {
    server.use(
      http.post(INITIATE, () =>
        HttpResponse.json(
          { detail: 'El monto no coincide.', codigo_error: 'AMOUNT_MISMATCH' },
          { status: 422 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(
      initiateCheckoutApiPayment({ order_number: 'PY-24815', token: 'tok', payment_method_id: 'visa' }),
    );
    const s = store.getState().payments;
    expect(s.actionError).toBeTruthy();
    expect(s.actionError.statusCode).toBe(422);
    expect(s.lastAction).toBeNull();
  });

  it('400 ORDER_NOT_PAYABLE: registra actionError con statusCode 400', async () => {
    server.use(
      http.post(INITIATE, () =>
        HttpResponse.json(
          { detail: 'La orden no es pagable.', codigo_error: 'ORDER_NOT_PAYABLE' },
          { status: 400 },
        ),
      ),
    );
    const store = makeStore();
    await store.dispatch(retryPayment({ order_number: 'PY-24815', gateway: 'MERCADOPAGO' }));
    const s = store.getState().payments;
    expect(s.actionError).toBeTruthy();
    expect(s.actionError.statusCode).toBe(400);
  });

  it('clearPaymentsActionState reinicia el estado de acción', async () => {
    server.use(
      http.post(INITIATE, () =>
        HttpResponse.json({ status: 'approved', status_detail: 'accredited' }),
      ),
    );
    const store = makeStore();
    await store.dispatch(
      initiateCheckoutApiPayment({ order_number: 'PY-1', token: 't', payment_method_id: 'visa' }),
    );
    expect(store.getState().payments.lastInitiation).not.toBeNull();
    store.dispatch(clearPaymentsActionState());
    const s = store.getState().payments;
    expect(s.lastInitiation).toBeNull();
    expect(s.lastAction).toBeNull();
    expect(s.actionError).toBeNull();
  });
});
