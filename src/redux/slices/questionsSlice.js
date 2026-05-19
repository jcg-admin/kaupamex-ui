/**
 * questionsSlice — PracticaYoruba
 *
 *   UC-QST-01 — Hacer pregunta sobre producto (publico, opt auth)
 *   UC-QST-02 — Ver preguntas y respuestas (publico, hook React Query)
 *   UC-QST-03 — Responder pregunta (admin)
 *   UC-QST-04 — Moderar preguntas (admin: aprobar / rechazar)
 *
 * Lecturas (lista publica, cola admin) viven en
 * `src/hooks/domain/useProductQuestions.js` via React Query.
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '@services/apiService';
import { serializeApiError } from '@utils/serializeApiError';

const PUBLIC_ASK_URL              = (productId) => `/api/v1/products/${productId}/questions/`;
const ADMIN_ANSWER_URL            = (id) => `/api/v1/admin/questions/${id}/answer/`;
const ADMIN_MODERATE_APPROVE_URL  = (id) => `/api/v1/admin/questions/${id}/approve/`;
const ADMIN_MODERATE_REJECT_URL   = (id) => `/api/v1/admin/questions/${id}/reject/`;

// =============================================================================
// Thunks
// =============================================================================

/** UC-QST-01: visitante envia una pregunta sobre un producto. */
export const askProductQuestion = createAsyncThunk(
  'questions/ask',
  async ({ productId, body, email }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(PUBLIC_ASK_URL(productId), {
        body,
        email: email || null,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-QST-03: admin responde la pregunta. */
export const answerProductQuestion = createAsyncThunk(
  'questions/answer',
  async ({ id, body }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_ANSWER_URL(id), { body });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-QST-04: admin aprueba la pregunta para pasar a cola de respuesta. */
export const approveProductQuestion = createAsyncThunk(
  'questions/approve',
  async ({ id, editedBody }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_MODERATE_APPROVE_URL(id), {
        edited_body: editedBody || null,
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(serializeApiError(err));
    }
  },
);

/** UC-QST-04: admin rechaza la pregunta. */
export const rejectProductQuestion = createAsyncThunk(
  'questions/reject',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const res = await apiService.post(ADMIN_MODERATE_REJECT_URL(id), {
        reason: reason || 'INAPROPIADA',
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
  isActioning: false,
  actionError: null,
  lastAction:  null, // 'asked' | 'answered' | 'approved' | 'rejected'
  lastAskedId: null,
};

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    clearQuestionsActionState(state) {
      state.actionError = null;
      state.lastAction  = null;
      state.lastAskedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(askProductQuestion.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(askProductQuestion.fulfilled, (state, action) => {
        state.isActioning = false;
        state.lastAction  = 'asked';
        state.lastAskedId = action.payload?.id ?? null;
      })
      .addCase(askProductQuestion.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(answerProductQuestion.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(answerProductQuestion.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'answered';
      })
      .addCase(answerProductQuestion.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(approveProductQuestion.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(approveProductQuestion.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'approved';
      })
      .addCase(approveProductQuestion.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      })

      .addCase(rejectProductQuestion.pending, (state) => {
        state.isActioning = true;
        state.actionError = null;
      })
      .addCase(rejectProductQuestion.fulfilled, (state) => {
        state.isActioning = false;
        state.lastAction  = 'rejected';
      })
      .addCase(rejectProductQuestion.rejected, (state, action) => {
        state.isActioning = false;
        state.actionError = action.payload;
      });
  },
});

export const { clearQuestionsActionState } = questionsSlice.actions;
export default questionsSlice.reducer;
