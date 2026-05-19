/**
 * reviewsSlice — PracticaYoruba
 *
 *   UC-REV-01 — Dejar resena de producto comprado (comprador)
 *   UC-REV-02 — Ver resenas aprobadas (publico, hook React Query)
 *   UC-REV-03 — Moderar resenas: aprobar / rechazar (admin)
 *
 * Lecturas (lista publica + cola admin) viven en
 * `src/hooks/domain/useReviews.js` via React Query.
 *
 * English identifiers + English JSON keys (DEC-DOC-005). Cada catch
 * propaga el error tipado via `serializeApiError` (DEC-DOC-008).
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const PUBLIC_CREATE_URL          = (productId) => `/api/v1/products/${productId}/reviews/`;
const ADMIN_MODERATE_APPROVE_URL = (id) => `/api/v1/admin/reviews/${id}/approve/`;
const ADMIN_MODERATE_REJECT_URL  = (id) => `/api/v1/admin/reviews/${id}/reject/`;

// =============================================================================
// Thunks
// =============================================================================

/** UC-REV-01: comprador envia una resena del producto comprado. */
export const submitProductReview = createAsyncThunk(
  'reviews/submit',
  async ({ productId, orderId, rating, title, body }, { rejectWithValue }) => {
    try {
      const payload = {
        order_id: orderId,
        rating,
        title,
        body,
      };
      const res = await apiService.post(PUBLIC_CREATE_URL(productId), payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-REV-03: admin aprueba la resena para publicarla. */
export const approveProductReview = createAsyncThunk(
  'reviews/approve',
  async ({ id }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_MODERATE_APPROVE_URL(id), {});
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-REV-03: admin rechaza la resena con motivo obligatorio. */
export const rejectProductReview = createAsyncThunk(
  'reviews/reject',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_MODERATE_REJECT_URL(id), {
        reason: reason || 'CONTENIDO_INAPROPIADO',
      });
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
  isActioning:    false,
  actionError:    null,
  lastAction:     null, // 'submitted' | 'approved' | 'rejected'
  lastSubmittedId: null,
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewsActionState(state) {
      state.actionError     = null;
      state.lastAction      = null;
      state.lastSubmittedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitProductReview.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(submitProductReview.fulfilled, (state, action) => {
        state.isActioning     = false;
        state.lastAction      = 'submitted';
        state.lastSubmittedId = action.payload?.id ?? null;
      })
      .addCase(submitProductReview.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(approveProductReview.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(approveProductReview.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'approved';
      })
      .addCase(approveProductReview.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(rejectProductReview.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(rejectProductReview.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'rejected';
      })
      .addCase(rejectProductReview.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearReviewsActionState } = reviewsSlice.actions;
export default reviewsSlice.reducer;
