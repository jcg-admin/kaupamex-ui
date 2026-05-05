/**
 * Selectors — PracticaYoruba
 * Selectores memoizados con reselect para evitar re-renders innecesarios
 */

import { createSelector } from 'reselect';

// ─── Auth ──────────────────────────────────────────────────────────────
const selectAuthState  = (state) => state.auth;
export const selectUser            = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectIsAdmin         = (state) => state.auth.user?.is_staff ?? false;
export const selectAuthLoading     = (state) => state.auth.isLoading;
export const selectAuthError       = (state) => state.auth.error;

// ─── UI ────────────────────────────────────────────────────────────────
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
export const selectIsDarkMode    = (state) => state.ui.isDarkMode;
export const selectIsSearchOpen  = (state) => state.ui.isSearchOpen;
export const selectActiveModal   = (state) => state.ui.activeModal;
export const selectModalProps    = (state) => state.ui.modalProps;
export const selectToasts        = (state) => state.ui.toasts;

// ─── Cart ──────────────────────────────────────────────────────────────
export const selectCartItems     = (state) => state.cart.items;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartTotals    = (state) => state.cart.totals;
export const selectCartVoucher   = (state) => state.cart.voucher;
export const selectCartLoading   = (state) => state.cart.isLoading;
export const selectCartError     = (state) => state.cart.error;

export const selectIsCartEmpty = createSelector(
  selectCartItems,
  (items) => items.length === 0
);

export const selectCartItemById = createSelector(
  selectCartItems,
  (_, itemId) => itemId,
  (items, itemId) => items.find((i) => i.id === itemId)
);

// ─── Catalog ───────────────────────────────────────────────────────────
export const selectProducts        = (state) => state.catalog.products;
export const selectCurrentProduct  = (state) => state.catalog.currentProduct;
export const selectCategories      = (state) => state.catalog.categories;
export const selectCatalogFilters  = (state) => state.catalog.filters;
export const selectCatalogLoading  = (state) => state.catalog.isLoading;
export const selectSearchResults   = (state) => state.catalog.searchResults;
export const selectSearchQuery     = (state) => state.catalog.searchQuery;
export const selectIsSearching     = (state) => state.catalog.isSearching;
export const selectPagination      = (state) => state.catalog.pagination;

// ─── Checkout ──────────────────────────────────────────────────────────
export const selectCheckoutStep    = (state) => state.checkout.step;
export const selectCheckoutAddress = (state) => state.checkout.address;
export const selectShippingMethod  = (state) => state.checkout.shippingMethod;
export const selectPaymentMethod   = (state) => state.checkout.paymentMethod;
export const selectOrderId         = (state) => state.checkout.orderId;
export const selectPaymentData     = (state) => state.checkout.paymentData;
export const selectCheckoutLoading = (state) => state.checkout.isLoading;
export const selectCheckoutError   = (state) => state.checkout.error;

// ─── Orders ────────────────────────────────────────────────────────────
export const selectOrders        = (state) => state.orders.orders;
export const selectCurrentOrder  = (state) => state.orders.currentOrder;
export const selectOrdersLoading = (state) => state.orders.isLoading;

// ─── Wishlist ──────────────────────────────────────────────────────────
export const selectWishlistItems   = (state) => state.wishlist.items;
export const selectWishlistLoading = (state) => state.wishlist.isLoading;

export const selectIsInWishlist = createSelector(
  selectWishlistItems,
  (_, productId) => productId,
  (items, productId) => items.some((i) => i.product_id === productId)
);

// ─── Error ─────────────────────────────────────────────────────────────
export { selectGlobalError, selectContextErrors, selectIsHandlingError, selectContextError }
  from '../slices/errorSlice';
