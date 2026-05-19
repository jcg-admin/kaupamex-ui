/**
 * AppRouter — PracticaYoruba
 * Rutas de la tienda con lazy loading por página
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import StorefrontLayout from '@layouts/StorefrontLayout';
import AccountLayout    from '@layouts/AccountLayout';
import AdminLayout      from '@layouts/AdminLayout';
import ProtectedRoute   from '@components/shared/ProtectedRoute';
import AdminRoute       from '@components/shared/ProtectedRoute/AdminRoute';
import PageLoader       from '@components/shared/LazyLoad/PageLoader';

// Lazy pages — Storefront
const HomePage        = lazy(() => import('@pages/home/HomePage'));
const CatalogPage     = lazy(() => import('@pages/catalog/CatalogPage'));
const ProductPage     = lazy(() => import('@pages/catalog/ProductPage'));
const CartPage        = lazy(() => import('@pages/cart/CartPage'));
const CheckoutPage    = lazy(() => import('@pages/checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@pages/checkout/OrderSuccessPage'));

// Lazy pages — Auth
const LoginPage       = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage    = lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@pages/auth/ResetPasswordPage'));

// Lazy pages — Cuenta del comprador
const AccountPage     = lazy(() => import('@pages/account/AccountPage'));
const OrdersPage      = lazy(() => import('@pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('@pages/account/OrderDetailPage'));
const WishlistPage    = lazy(() => import('@pages/account/WishlistPage'));
const ProfilePage     = lazy(() => import('@pages/account/ProfilePage'));

// Lazy pages — Soporte (tickets del comprador)
const SupportTicketsPage       = lazy(() => import('@pages/account/SupportTicketsPage'));
const SupportTicketCreatePage  = lazy(() => import('@pages/account/SupportTicketCreatePage'));
const SupportTicketDetailPage  = lazy(() => import('@pages/account/SupportTicketDetailPage'));

// Lazy pages — Devoluciones (comprador)
const ReturnsPage             = lazy(() => import('@pages/account/ReturnsPage'));
const ReturnCreatePage        = lazy(() => import('@pages/account/ReturnCreatePage'));
const ReturnDetailPage        = lazy(() => import('@pages/account/ReturnDetailPage'));

// Lazy pages — Admin
const AdminDashboardPage  = lazy(() => import('@pages/admin/AdminDashboardPage'));
const AdminProductsPage   = lazy(() => import('@pages/admin/AdminProductsPage'));
const AdminOrdersPage     = lazy(() => import('@pages/admin/AdminOrdersPage'));
const AdminUsersPage      = lazy(() => import('@pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('@pages/admin/AdminUserDetailPage'));
const AdminVouchersPage   = lazy(() => import('@pages/admin/AdminVouchersPage'));
const AdminSupportPage    = lazy(() => import('@pages/admin/AdminSupportPage'));
const AdminReturnsPage    = lazy(() => import('@pages/admin/AdminReturnsPage'));

// Lazy pages — Generales
const NotFoundPage    = lazy(() => import('@pages/NotFoundPage'));

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ─── Tienda pública ─── */}
          <Route element={<StorefrontLayout />}>
            <Route index element={<HomePage />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="catalog/:slug" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
          </Route>

          {/* ─── Auth ─── */}
          <Route path="auth">
            <Route path="login"                    element={<LoginPage />} />
            <Route path="register"                 element={<RegisterPage />} />
            <Route path="forgot-password"          element={<ForgotPasswordPage />} />
            <Route path="reset-password/:uid/:token" element={<ResetPasswordPage />} />
          </Route>

          {/* ─── Checkout (requiere auth) ─── */}
          <Route element={<ProtectedRoute />}>
            <Route path="checkout" element={<CheckoutPage />} />
            <Route path="order/:id/confirmation" element={<OrderSuccessPage />} />
          </Route>

          {/* ─── Cuenta del comprador ─── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AccountLayout />}>
              <Route path="account"             element={<AccountPage />} />
              <Route path="account/orders"      element={<OrdersPage />} />
              <Route path="account/orders/:id"  element={<OrderDetailPage />} />
              <Route path="account/wishlist"    element={<WishlistPage />} />
              <Route path="account/profile"     element={<ProfilePage />} />
              <Route path="account/returns"     element={<ReturnsPage />} />
              <Route path="account/returns/new" element={<ReturnCreatePage />} />
              <Route path="account/returns/:id" element={<ReturnDetailPage />} />
            </Route>
          </Route>

          {/* ─── Soporte (tickets del comprador) ─── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AccountLayout />}>
              <Route path="support/tickets"      element={<SupportTicketsPage />} />
              <Route path="support/tickets/new"  element={<SupportTicketCreatePage />} />
              <Route path="support/tickets/:id"  element={<SupportTicketDetailPage />} />
            </Route>
          </Route>

          {/* ─── Admin ─── */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="admin"             element={<AdminDashboardPage />} />
              <Route path="admin/products"    element={<AdminProductsPage />} />
              <Route path="admin/orders"      element={<AdminOrdersPage />} />
              <Route path="admin/users"       element={<AdminUsersPage />} />
              <Route path="admin/users/:pk"   element={<AdminUserDetailPage />} />
              <Route path="admin/vouchers"    element={<AdminVouchersPage />} />
              <Route path="admin/support"     element={<AdminSupportPage />} />
              <Route path="admin/returns"     element={<AdminReturnsPage />} />
            </Route>
          </Route>

          {/* ─── Fallbacks ─── */}
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*"   element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
