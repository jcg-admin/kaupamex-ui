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

// Lazy pages — Admin
const AdminDashboardPage  = lazy(() => import('@pages/admin/AdminDashboardPage'));
const AdminProductsPage   = lazy(() => import('@pages/admin/AdminProductsPage'));
const AdminOrdersPage     = lazy(() => import('@pages/admin/AdminOrdersPage'));
const AdminUsersPage      = lazy(() => import('@pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('@pages/admin/AdminUserDetailPage'));

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
            <Route path="catalogo" element={<CatalogPage />} />
            <Route path="catalogo/:slug" element={<ProductPage />} />
            <Route path="carrito" element={<CartPage />} />
          </Route>

          {/* ─── Auth ─── */}
          <Route path="auth">
            <Route path="login"             element={<LoginPage />} />
            <Route path="registro"          element={<RegisterPage />} />
            <Route path="recuperar"         element={<ForgotPasswordPage />} />
            <Route path="restablecer/:uid/:token" element={<ResetPasswordPage />} />
          </Route>

          {/* ─── Checkout (requiere auth) ─── */}
          <Route element={<ProtectedRoute />}>
            <Route path="checkout"    element={<CheckoutPage />} />
            <Route path="pedido/:id/confirmacion" element={<OrderSuccessPage />} />
          </Route>

          {/* ─── Cuenta del comprador ─── */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AccountLayout />}>
              <Route path="mi-cuenta"       element={<AccountPage />} />
              <Route path="mi-cuenta/pedidos"    element={<OrdersPage />} />
              <Route path="mi-cuenta/pedidos/:id" element={<OrderDetailPage />} />
              <Route path="mi-cuenta/favoritos"  element={<WishlistPage />} />
              <Route path="mi-cuenta/perfil"     element={<ProfilePage />} />
            </Route>
          </Route>

          {/* ─── Admin ─── */}
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="admin"              element={<AdminDashboardPage />} />
              <Route path="admin/productos"    element={<AdminProductsPage />} />
              <Route path="admin/pedidos"      element={<AdminOrdersPage />} />
              <Route path="admin/usuarios"     element={<AdminUsersPage />} />
              <Route path="admin/usuarios/:pk" element={<AdminUserDetailPage />} />
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
