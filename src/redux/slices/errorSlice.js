/**
 * Error Slice — PracticaYoruba
 *
 * Manejo centralizado de errores de la aplicación.
 * Usado por errorHandlingMiddleware para capturar automáticamente
 * cualquier acción rejected del store.
 *
 * Estructura:
 *   globalError   — error visible al usuario (banner/toast global)
 *   contextErrors — mapa de errores por dominio (cart, catalog, auth, ...)
 *   isHandling    — flag que indica que el middleware está procesando un error
 */

import { createSlice } from '@reduxjs/toolkit';

const errorSlice = createSlice({
  name: 'error',
  initialState: {
    globalError:   null,       // { message, code, statusCode, timestamp }
    contextErrors: {},         // { [dominio]: { message, code, statusCode } }
    isHandling:    false,
  },
  reducers: {
    /**
     * Establece un error global visible en toda la UI.
     * Usado para errores 500 y errores de red.
     */
    handleAPIError(state, action) {
      const error = action.payload;
      state.globalError = {
        message:    error?.message    ?? 'Error inesperado.',
        code:       error?.code       ?? 'UNKNOWN',
        statusCode: error?.statusCode ?? null,
        timestamp:  new Date().toISOString(),
      };
    },

    /**
     * Establece un error asociado a un dominio específico.
     * Ej: setContextError({ context: 'cart', error: { message: 'Sin stock' } })
     */
    setContextError(state, action) {
      const { context, error } = action.payload;
      if (!context) return;
      state.contextErrors[context] = {
        message:    error?.message    ?? 'Error en la operación.',
        code:       error?.code       ?? 'UNKNOWN',
        statusCode: error?.statusCode ?? null,
        timestamp:  new Date().toISOString(),
      };
    },

    /**
     * Limpia el error global.
     */
    clearGlobalError(state) {
      state.globalError = null;
    },

    /**
     * Limpia el error de un dominio específico.
     */
    clearContextError(state, action) {
      const context = action.payload;
      delete state.contextErrors[context];
    },

    /**
     * Limpia todos los errores (global + contextos).
     */
    clearAllErrors(state) {
      state.globalError   = null;
      state.contextErrors = {};
    },

    /**
     * Flag interno — el middleware lo activa mientras procesa un /rejected.
     */
    setErrorHandling(state, action) {
      state.isHandling = action.payload;
    },
  },
});

export const {
  handleAPIError,
  setContextError,
  clearGlobalError,
  clearContextError,
  clearAllErrors,
  setErrorHandling,
} = errorSlice.actions;

export default errorSlice.reducer;

// ─── Selectores ────────────────────────────────────────────────────────
export const selectGlobalError      = (state) => state.error.globalError;
export const selectContextErrors    = (state) => state.error.contextErrors;
export const selectIsHandlingError  = (state) => state.error.isHandling;
export const selectContextError     = (context) =>
  (state) => state.error.contextErrors[context] ?? null;
