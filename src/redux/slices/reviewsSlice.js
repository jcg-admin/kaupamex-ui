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

const PUBLIC_CREATE_URL         = (productId) => `/api/v2/products/${productId}/reviews/`;
const REVIEW_IMAGES_URL         = (productId, reviewId) => `/api/v2/products/${productId}/reviews/${reviewId}/images/`;
// F3 Tier B: approve/reject merged into PATCH /admin/reviews/<id>/status/
const ADMIN_MODERATE_STATUS_URL = (id) => `/api/v2/admin/reviews/${id}/status/`;

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

/**
 * UC-REV-02 cap6: upload images for a review the author just created.
 * Accepts an array of File objects (max 3). Each image is POSTed
 * individually as multipart/form-data to the review images endpoint.
 * Returns an array of created image objects.
 */
export const uploadReviewImages = createAsyncThunk(
  'reviews/uploadImages',
  async ({ productId, reviewId, images }, { rejectWithValue }) => {
    try {
      const results = [];
      for (const file of images) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await apiService.post(
          REVIEW_IMAGES_URL(productId, reviewId),
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        results.push(res.data);
      }
      return results;
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
      const res = await apiService.patch(ADMIN_MODERATE_STATUS_URL(id), { status: 'APPROVED' });
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
      const res = await apiService.patch(ADMIN_MODERATE_STATUS_URL(id), {
        status: 'REJECTED',
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
  isActioning:      false,
  actionError:      null,
  lastAction:       null, // 'submitted' | 'approved' | 'rejected'
  lastSubmittedId:  null,
  isUploadingImages: false,
  imageUploadError:  null,
  uploadedImages:    [],
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewsActionState(state) {
      state.actionError       = null;
      state.lastAction        = null;
      state.lastSubmittedId   = null;
      state.imageUploadError  = null;
      state.uploadedImages    = [];
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

      .addCase(uploadReviewImages.pending, (state) => {
        state.isUploadingImages = true;
        state.imageUploadError  = null;
      })
      .addCase(uploadReviewImages.fulfilled, (state, action) => {
        state.isUploadingImages = false;
        state.uploadedImages    = action.payload;
      })
      .addCase(uploadReviewImages.rejected, (state, action) => {
        state.isUploadingImages = false;
        state.imageUploadError  = action.payload;
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
