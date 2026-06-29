/**
 * Tests — cardsSlice (UC-PAY-14: Gestión de tarjetas guardadas)
 */
import { configureStore } from '@reduxjs/toolkit';
import { http, HttpResponse } from 'msw';
import { server } from '@mocks/server';
import cardsReducer, {
  fetchCustomerCards,
  saveCard,
  saveCardWithZDA,
  updateCard,
  deleteCard,
  clearSaveStatus,
} from './cardsSlice';

const BASE = process.env.API_URL || 'http://localhost:8000';

const makeStore = () => configureStore({ reducer: { cards: cardsReducer } });

const MOCK_CARD = {
  id:               'card-001',
  last_four_digits: '1234',
  first_six_digits: '411111',
  expiration_month: 12,
  expiration_year:  2028,
  payment_method_id: 'visa',
  cardholder_name:  'Test User',
  status:           'active',
};

describe('cardsSlice', () => {
  it('has correct initial state', () => {
    const state = makeStore().getState().cards;
    expect(state).toEqual({ items: [], loading: false, error: null, saveStatus: null });
  });

  it('clearSaveStatus resets saveStatus and error', () => {
    const store = makeStore();
    store.dispatch({ type: 'cards/save/rejected', payload: { message: 'err' } });
    store.dispatch(clearSaveStatus());
    const { error, saveStatus } = store.getState().cards;
    expect(error).toBeNull();
    expect(saveStatus).toBeNull();
  });

  describe('fetchCustomerCards', () => {
    it('pending sets loading=true and clears error', () => {
      const store = makeStore();
      store.dispatch({ type: 'cards/fetchAll/pending' });
      const { loading, error } = store.getState().cards;
      expect(loading).toBe(true);
      expect(error).toBeNull();
    });

    it('fulfilled sets items and loading=false', async () => {
      server.use(
        http.get(`${BASE}/api/v2/payments/cards/`, () =>
          HttpResponse.json([MOCK_CARD]),
        ),
      );
      const store = makeStore();
      await store.dispatch(fetchCustomerCards());
      const { items, loading, error } = store.getState().cards;
      expect(loading).toBe(false);
      expect(error).toBeNull();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('card-001');
    });

    it('rejected sets error and loading=false', async () => {
      server.use(
        http.get(`${BASE}/api/v2/payments/cards/`, () =>
          HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 }),
        ),
      );
      const store = makeStore();
      await store.dispatch(fetchCustomerCards());
      const { loading, error } = store.getState().cards;
      expect(loading).toBe(false);
      expect(error).not.toBeNull();
    });
  });

  describe('saveCard', () => {
    it('pending sets loading=true and clears saveStatus', () => {
      const store = makeStore();
      store.dispatch({ type: 'cards/save/pending' });
      const { loading, saveStatus } = store.getState().cards;
      expect(loading).toBe(true);
      expect(saveStatus).toBeNull();
    });

    it('fulfilled sets saveStatus with response data', async () => {
      server.use(
        http.post(`${BASE}/api/v2/payments/cards/`, () =>
          HttpResponse.json(
            { id: 'card-001', last_four_digits: '1234', status: 'pending_verification', verification_sent: true },
            { status: 201 },
          ),
        ),
      );
      const store = makeStore();
      await store.dispatch(saveCard('tok-test'));
      const { saveStatus, loading } = store.getState().cards;
      expect(loading).toBe(false);
      expect(saveStatus).toMatchObject({ id: 'card-001', verification_sent: true });
    });

    it('rejected sets error and saveStatus=null', async () => {
      server.use(
        http.post(`${BASE}/api/v2/payments/cards/`, () =>
          HttpResponse.json({ codigo_error: 'GATEWAY_ERROR' }, { status: 502 }),
        ),
      );
      const store = makeStore();
      await store.dispatch(saveCard('bad-tok'));
      const { error, saveStatus } = store.getState().cards;
      expect(error).not.toBeNull();
      expect(saveStatus).toBeNull();
    });
  });

  describe('updateCard', () => {
    it('fulfilled updates card in items list', async () => {
      const updated = { ...MOCK_CARD, cardholder_name: 'Updated Name' };
      server.use(
        http.put(`${BASE}/api/v2/payments/cards/:id/`, () =>
          HttpResponse.json(updated),
        ),
      );
      const store = makeStore();
      store.dispatch({ type: 'cards/fetchAll/fulfilled', payload: [MOCK_CARD] });
      await store.dispatch(updateCard({ cardId: 'card-001', data: { cardholder_name: 'Updated Name' } }));
      expect(store.getState().cards.items[0].cardholder_name).toBe('Updated Name');
    });

    it('rejected sets error', async () => {
      server.use(
        http.put(`${BASE}/api/v2/payments/cards/:id/`, () =>
          HttpResponse.json({ codigo_error: 'CARD_NOT_FOUND' }, { status: 404 }),
        ),
      );
      const store = makeStore();
      await store.dispatch(updateCard({ cardId: 'card-999', data: {} }));
      expect(store.getState().cards.error).not.toBeNull();
    });
  });

  describe('deleteCard', () => {
    it('fulfilled removes card from items by id', async () => {
      server.use(
        http.delete(`${BASE}/api/v2/payments/cards/:id/`, () =>
          new HttpResponse(null, { status: 204 }),
        ),
      );
      const store = makeStore();
      store.dispatch({ type: 'cards/fetchAll/fulfilled', payload: [MOCK_CARD] });
      await store.dispatch(deleteCard('card-001'));
      expect(store.getState().cards.items).toHaveLength(0);
    });

    it('rejected sets error', async () => {
      server.use(
        http.delete(`${BASE}/api/v2/payments/cards/:id/`, () =>
          HttpResponse.json({ codigo_error: 'CARD_NOT_FOUND' }, { status: 404 }),
        ),
      );
      const store = makeStore();
      await store.dispatch(deleteCard('card-999'));
      expect(store.getState().cards.error).not.toBeNull();
    });
  });

  describe('saveCardWithZDA', () => {
    it('validates and saves card when ZDA returns valid=true', async () => {
      server.use(
        http.post(`${BASE}/api/v2/payments/cards/validate/`, () =>
          HttpResponse.json({ valid: true }),
        ),
        http.post(`${BASE}/api/v2/payments/cards/`, () =>
          HttpResponse.json(
            { id: 'card-zda-001', last_four_digits: '4242', status: 'pending_verification', verification_sent: true },
            { status: 201 },
          ),
        ),
      );
      const store = makeStore();
      await store.dispatch(saveCardWithZDA({ token: 'tok-valid', paymentMethodId: 'visa' }));
      const { saveStatus, loading, error } = store.getState().cards;
      expect(loading).toBe(false);
      expect(error).toBeNull();
      expect(saveStatus).toMatchObject({ id: 'card-zda-001', verification_sent: true });
    });

    it('rejects with CARD_VALIDATION_FAILED when ZDA returns valid=false', async () => {
      server.use(
        http.post(`${BASE}/api/v2/payments/cards/validate/`, () =>
          HttpResponse.json({ valid: false }),
        ),
      );
      const store = makeStore();
      await store.dispatch(saveCardWithZDA({ token: 'tok-bad', paymentMethodId: 'visa' }));
      const { saveStatus, error } = store.getState().cards;
      expect(saveStatus).toBeNull();
      expect(error).toMatchObject({ codigo_error: 'CARD_VALIDATION_FAILED' });
    });

    it('rejects with gateway error when validate endpoint fails', async () => {
      server.use(
        http.post(`${BASE}/api/v2/payments/cards/validate/`, () =>
          HttpResponse.json({ codigo_error: 'GATEWAY_ERROR' }, { status: 502 }),
        ),
      );
      const store = makeStore();
      await store.dispatch(saveCardWithZDA({ token: 'tok-err', paymentMethodId: 'visa' }));
      const { saveStatus, error } = store.getState().cards;
      expect(saveStatus).toBeNull();
      expect(error).not.toBeNull();
    });
  });
});
