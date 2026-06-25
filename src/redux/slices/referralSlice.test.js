/**
 * Tests — referralSlice
 * Programa de referidos: fetchReferral (GET) + redeemReferral (POST).
 * Patron canonico D-010: errores tipados via serializeApiError; el
 * campo `code` transporta el codigo_error del backend.
 */
import { configureStore } from '@reduxjs/toolkit';

jest.mock('@services/apiService', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

import apiService from '@services/apiService';

import referralReducer, {
  fetchReferral,
  redeemReferral,
  clearReferralError,
  clearReferralRedeemState,
} from './referralSlice';

const makeStore = () =>
  configureStore({ reducer: { referral: referralReducer } });

afterEach(() => jest.clearAllMocks());

describe('referralSlice — initial state', () => {
  it('expone el estado inicial esperado', () => {
    const { referral } = makeStore().getState();
    expect(referral).toMatchObject({
      code:               null,
      shareLink:          null,
      totalReferrals:     0,
      completedReferrals: 0,
      rewardsEarned:      0,
      isLoading:          false,
      isProgramDisabled:  false,
      error:              null,
      isRedeeming:        false,
      redeemError:        null,
      lastRedeemSucceeded: false,
    });
  });
});

describe('referralSlice — fetchReferral', () => {
  it('normaliza el payload del backend (snake_case -> camelCase)', async () => {
    apiService.get.mockResolvedValue({
      data: {
        code:                'YORUBA-42',
        share_link:          'https://practicayoruba.test/r/YORUBA-42',
        total_referrals:     5,
        completed_referrals: 3,
        rewards_earned:      150,
      },
    });

    const store = makeStore();
    await store.dispatch(fetchReferral());
    const { referral } = store.getState();

    expect(apiService.get).toHaveBeenCalledWith('/api/v2/account/referral/');
    expect(referral.code).toBe('YORUBA-42');
    expect(referral.shareLink).toBe('https://practicayoruba.test/r/YORUBA-42');
    expect(referral.totalReferrals).toBe(5);
    expect(referral.completedReferrals).toBe(3);
    expect(referral.rewardsEarned).toBe(150);
    expect(referral.isLoading).toBe(false);
    expect(referral.isProgramDisabled).toBe(false);
    expect(referral.error).toBeNull();
  });

  it('marca isProgramDisabled cuando el GET responde 404 NOT_FOUND', async () => {
    apiService.get.mockRejectedValue({
      message: 'Not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    });

    const store = makeStore();
    await store.dispatch(fetchReferral());
    const { referral } = store.getState();

    expect(referral.isProgramDisabled).toBe(true);
    expect(referral.error).toBeNull();
    expect(referral.isLoading).toBe(false);
  });

  it('guarda el error en estado para fallos no-404', async () => {
    apiService.get.mockRejectedValue({
      message: 'Server error',
      code: 'SERVER_ERROR',
      statusCode: 500,
    });

    const store = makeStore();
    await store.dispatch(fetchReferral());
    const { referral } = store.getState();

    expect(referral.isProgramDisabled).toBe(false);
    expect(referral.error).toMatchObject({ statusCode: 500 });
  });

  it('clearReferralError limpia el error', async () => {
    apiService.get.mockRejectedValue({ message: 'boom', statusCode: 500 });
    const store = makeStore();
    await store.dispatch(fetchReferral());
    expect(store.getState().referral.error).not.toBeNull();
    store.dispatch(clearReferralError());
    expect(store.getState().referral.error).toBeNull();
  });
});

describe('referralSlice — redeemReferral', () => {
  it('canjea un codigo y marca lastRedeemSucceeded', async () => {
    apiService.post.mockResolvedValue({ data: { detail: 'ok' } });

    const store = makeStore();
    await store.dispatch(redeemReferral('YORUBA-99'));
    const { referral } = store.getState();

    expect(apiService.post).toHaveBeenCalledWith(
      '/api/v2/account/referral/redeem/',
      { code: 'YORUBA-99' },
    );
    expect(referral.lastRedeemSucceeded).toBe(true);
    expect(referral.isRedeeming).toBe(false);
    expect(referral.redeemError).toBeNull();
  });

  it('preserva el codigo_error en redeemError ante un 422', async () => {
    apiService.post.mockRejectedValue({
      message: 'Self referral',
      code: 'SELF_REFERRAL_NOT_ALLOWED',
      statusCode: 422,
    });

    const store = makeStore();
    await store.dispatch(redeemReferral('MY-OWN-CODE'));
    const { referral } = store.getState();

    expect(referral.lastRedeemSucceeded).toBe(false);
    expect(referral.isRedeeming).toBe(false);
    expect(referral.redeemError).toMatchObject({
      code: 'SELF_REFERRAL_NOT_ALLOWED',
    });
  });

  it('clearReferralRedeemState limpia error y bandera de exito', async () => {
    apiService.post.mockResolvedValue({ data: {} });
    const store = makeStore();
    await store.dispatch(redeemReferral('ABC'));
    expect(store.getState().referral.lastRedeemSucceeded).toBe(true);
    store.dispatch(clearReferralRedeemState());
    expect(store.getState().referral.lastRedeemSucceeded).toBe(false);
    expect(store.getState().referral.redeemError).toBeNull();
  });
});
