/**
 * Redux Store — PracticaYoruba
 * Estado centralizado del e-commerce
 *
 * Slices:
 *   auth     — sesión JWT, perfil del comprador
 *   ui       — sidebar, modal, darkMode, notificaciones
 *   catalog  — productos, categorías, filtros, búsqueda
 *   cart     — items, cantidades, voucher, totales
 *   checkout — paso actual, dirección, método de envío
 *   orders   — historial de órdenes del comprador
 *   wishlist — lista de deseos
 */

import { configureStore } from '@reduxjs/toolkit';

import authReducer     from './slices/authSlice';
import uiReducer       from './slices/uiSlice';
import catalogReducer  from './slices/catalogSlice';
import cartReducer     from './slices/cartSlice';
import checkoutReducer from './slices/checkoutSlice';
import ordersReducer   from './slices/ordersSlice';
import wishlistReducer from './slices/wishlistSlice';

const store = configureStore({
  reducer: {
    auth:     authReducer,
    ui:       uiReducer,
    catalog:  catalogReducer,
    cart:     cartReducer,
    checkout: checkoutReducer,
    orders:   ordersReducer,
    wishlist: wishlistReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;

/** @typedef {ReturnType<typeof store.getState>} RootState */
/** @typedef {typeof store.dispatch} AppDispatch */
