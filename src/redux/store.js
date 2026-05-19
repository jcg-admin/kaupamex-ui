/**
 * Redux Store — PracticaYoruba
 * Estado centralizado del e-commerce
 *
 * Slices:
 *   auth     — sesión JWT, perfil del comprador
 *   admin    — gestión de usuarios (Sprint 4)
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
import errorReducer    from './slices/errorSlice';
import adminReducer    from './slices/adminSlice';
import vouchersReducer from './slices/vouchersSlice';
import supportTicketsReducer from './slices/supportTicketsSlice';
import returnsReducer        from './slices/returnsSlice';
import inventoryReducer      from './slices/inventorySlice';
import yorubaVariantsReducer from './slices/yorubaVariantsSlice';
import notificationsReducer    from './slices/notificationsSlice';
import productDiscountsReducer from './slices/productDiscountsSlice';
import contactReducer          from './slices/contactSlice';
import newsletterReducer       from './slices/newsletterSlice';
import questionsReducer        from './slices/questionsSlice';
import paymentsReducer         from './slices/paymentsSlice';
import categoriesReducer        from './slices/categoriesSlice';
import productsReducer          from './slices/productsSlice';
import adminUsersReducer        from './slices/adminUsersSlice';
import permissionsReducer       from './slices/permissionsSlice';
import settingsReducer          from './slices/settingsSlice';
import backupsReducer           from './slices/backupsSlice';
import logisticsReducer         from './slices/logisticsSlice';
import reviewsReducer           from './slices/reviewsSlice';
import searchHistoryReducer     from './slices/searchHistorySlice';
import priceSyncReducer         from './slices/priceSyncSlice';

import {
  errorHandlingMiddleware,
  errorLoggingMiddleware,
} from './middleware/errorHandling';

const store = configureStore({
  reducer: {
    auth:     authReducer,
    ui:       uiReducer,
    catalog:  catalogReducer,
    cart:     cartReducer,
    checkout: checkoutReducer,
    orders:   ordersReducer,
    wishlist: wishlistReducer,
    error:    errorReducer,
    admin:    adminReducer,
    vouchers: vouchersReducer,
    supportTickets: supportTicketsReducer,
    returns:        returnsReducer,
    inventory:      inventoryReducer,
    yorubaVariants: yorubaVariantsReducer,
    notifications:  notificationsReducer,
    productDiscounts: productDiscountsReducer,
    contact:          contactReducer,
    newsletter:       newsletterReducer,
    questions:        questionsReducer,
    payments:         paymentsReducer,
    categories:       categoriesReducer,
    products:         productsReducer,
    adminUsers:       adminUsersReducer,
    permissions:      permissionsReducer,
    settings:         settingsReducer,
    backups:          backupsReducer,
    logistics:        logisticsReducer,
    reviews:          reviewsReducer,
    searchHistory:    searchHistoryReducer,
    priceSync:        priceSyncReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    })
    .concat(errorHandlingMiddleware)
    .concat(errorLoggingMiddleware),
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;

/** @typedef {ReturnType<typeof store.getState>} RootState */
/** @typedef {typeof store.dispatch} AppDispatch */
