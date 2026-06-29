/**
 * referralSlice — PracticaYoruba
 * Programa de referidos de la cuenta del comprador.
 *
 * Endpoints (backend api@24245e8):
 *
 *   GET  /api/v2/account/referral/
 *     -> 200 { code, share_link, total_referrals, completed_referrals,
 *              rewards_earned }
 *     -> 404 codigo_error=NOT_FOUND  (programa deshabilitado)
 *     -> 401 sin autenticar
 *
 *   POST /api/v2/account/referral/redemptions/   body { code }
 *     -> 201 canje exitoso
 *     -> 422 codigo_error SELF_REFERRAL_NOT_ALLOWED | VOUCHER_INACTIVE
 *     -> 404 codigo_error NOT_FOUND      (codigo desconocido)
 *     -> 409 codigo_error CONFLICT       (ya canjeado)
 *     -> 400 codigo_error INVALID_PAYLOAD (falta code)
 *
 * Patron canonico: serializeApiError preserva code / statusCode /
 * validationErrors (DEC-DOC-008: nunca silenciar errores). El campo
 * `code` del error transporta el `codigo_error` del backend para que la
 * UI discrimine cada caso de negocio.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const REFERRAL_URL        = '/api/v2/account/referral/';
const REFERRAL_REDEEM_URL = '/api/v2/account/referral/redeem/';

// =============================================================================
// Thunks
// =============================================================================

/** Obtiene el codigo de referido y las metricas del comprador. */
export const fetchReferral = createAsyncThunk(
  'referral/fetch',
  async (_arg, { rejectWithValue }) => {
    try {
      const res = await apiService.get(REFERRAL_URL);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** Canjea un codigo de referido recibido de otro comprador. */
export const redeemReferral = createAsyncThunk(
  'referral/redeem',
  async (code, { rejectWithValue }) => {
    try {
      const res = await apiService.post(REFERRAL_REDEEM_URL, { code });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

// =============================================================================
// Slice
// =============================================================================

const initialState = {
  code:                null,
  shareLink:           null,
  totalReferrals:      0,
  completedReferrals:  0,
  rewardsEarned:       0,
  isLoading:           false,
  isProgramDisabled:   false,  // true cuando GET responde 404 NOT_FOUND
  error:               null,
  isRedeeming:         false,
  redeemError:         null,
  lastRedeemSucceeded: false,
};

const referralSlice = createSlice({
  name: 'referral',
  initialState,

  reducers: {
    clearReferralError(state) {
      state.error = null;
    },
    clearReferralRedeemState(state) {
      state.redeemError         = null;
      state.lastRedeemSucceeded = false;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchReferral
      .addCase(fetchReferral.pending, (state) => {
        state.isLoading         = true;
        state.error             = null;
        state.isProgramDisabled = false;
      })
      .addCase(fetchReferral.fulfilled, (state, action) => {
        const payload = action.payload ?? {};
        state.code               = payload.code ?? null;
        state.shareLink          = payload.share_link ?? null;
        state.totalReferrals     = payload.total_referrals ?? 0;
        state.completedReferrals = payload.completed_referrals ?? 0;
        state.rewardsEarned      = payload.rewards_earned ?? 0;
        state.isLoading          = false;
        state.isProgramDisabled  = false;
      })
      .addCase(fetchReferral.rejected, (state, action) => {
        state.isLoading = false;
        const error = action.payload ?? { message: 'Error al cargar el programa de referidos.' };
        // 404 NOT_FOUND => el programa de referidos esta deshabilitado:
        // se trata como estado vacio, no como error duro.
        state.isProgramDisabled = error.statusCode === 404 || error.code === 'NOT_FOUND';
        state.error             = state.isProgramDisabled ? null : error;
      })

      // redeemReferral
      .addCase(redeemReferral.pending, (state) => {
        state.isRedeeming         = true;
        state.redeemError         = null;
        state.lastRedeemSucceeded = false;
      })
      .addCase(redeemReferral.fulfilled, (state) => {
        state.isRedeeming         = false;
        state.lastRedeemSucceeded = true;
      })
      .addCase(redeemReferral.rejected, (state, action) => {
        state.isRedeeming         = false;
        state.lastRedeemSucceeded = false;
        state.redeemError         = action.payload ?? { message: 'No se pudo canjear el codigo.' };
      });
  },
});

export const {
  clearReferralError,
  clearReferralRedeemState,
} = referralSlice.actions;

export default referralSlice.reducer;
