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

// Lazy pages — Comms publicas (contacto, newsletter, preguntas)
const ContactPage               = lazy(() => import('@pages/ContactPage'));
const NewsletterSubscribePage   = lazy(() => import('@pages/NewsletterSubscribePage'));
const NewsletterUnsubscribePage = lazy(() => import('@pages/NewsletterUnsubscribePage'));

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

// Lazy pages — Notificaciones (comprador)
const NotificationPreferencesPage = lazy(() => import('@pages/account/NotificationPreferencesPage'));

// Lazy pages — Admin
const AdminDashboardPage  = lazy(() => import('@pages/admin/AdminDashboardPage'));
const AdminProductsPage   = lazy(() => import('@pages/admin/AdminProductsPage'));
const AdminOrdersPage     = lazy(() => import('@pages/admin/AdminOrdersPage'));
const AdminUsersPage      = lazy(() => import('@pages/admin/AdminUsersPage'));
const AdminUserDetailPage = lazy(() => import('@pages/admin/AdminUserDetailPage'));
const AdminVouchersPage   = lazy(() => import('@pages/admin/AdminVouchersPage'));
const AdminSupportPage    = lazy(() => import('@pages/admin/AdminSupportPage'));
const AdminReturnsPage    = lazy(() => import('@pages/admin/AdminReturnsPage'));
const AdminReturnDetailPage = lazy(() => import('@pages/admin/AdminReturnDetailPage'));
const AdminInventoryPage             = lazy(() => import('@pages/admin/AdminInventoryPage'));
const AdminInventoryImportPage       = lazy(() => import('@pages/admin/AdminInventoryImportPage'));
const AdminInventoryMovementsPage    = lazy(() => import('@pages/admin/AdminInventoryMovementsPage'));
const AdminInventoryAdjustPage       = lazy(() => import('@pages/admin/AdminInventoryAdjustPage'));
const AdminVariantsPage              = lazy(() => import('@pages/admin/AdminVariantsPage'));
const AdminVariantPricePage          = lazy(() => import('@pages/admin/AdminVariantPricePage'));
const AdminNotificationComposePage   = lazy(() => import('@pages/admin/AdminNotificationComposePage'));
const AdminProductDiscountsPage      = lazy(() => import('@pages/admin/AdminProductDiscountsPage'));
const AdminReportSalesPage           = lazy(() => import('@pages/admin/AdminReportSalesPage'));
const AdminReportTopSellersPage      = lazy(() => import('@pages/admin/AdminReportTopSellersPage'));
const AdminReportCustomersRfmPage    = lazy(() => import('@pages/admin/AdminReportCustomersRfmPage'));
const AdminReportDashboardPage       = lazy(() => import('@pages/admin/AdminReportDashboardPage'));
const AdminContactMessagesPage       = lazy(() => import('@pages/admin/AdminContactMessagesPage'));
const AdminContactMessageDetailPage  = lazy(() => import('@pages/admin/AdminContactMessageDetailPage'));

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
            {/* UC-COM-01 — Formulario publico de contacto */}
            <Route path="contact" element={<ContactPage />} />
            {/* UC-NEW-01 — Suscripcion publica al newsletter */}
            <Route path="newsletter" element={<NewsletterSubscribePage />} />
            {/* UC-NEW-02 — Desuscripcion via token firmado */}
            <Route path="newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />
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
              <Route path="account/notifications/preferences" element={<NotificationPreferencesPage />} />
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
              <Route path="admin/returns/:id" element={<AdminReturnDetailPage />} />
              <Route path="admin/inventory"                       element={<AdminInventoryPage />} />
              <Route path="admin/inventory/import"                element={<AdminInventoryImportPage />} />
              <Route path="admin/inventory/:variantId/movements"  element={<AdminInventoryMovementsPage />} />
              <Route path="admin/inventory/:variantId/adjust"     element={<AdminInventoryAdjustPage />} />
              {/* UC-CHT-03 / UC-CHT-04 — Variantes Yoruba */}
              <Route path="admin/products/:productId/variants"    element={<AdminVariantsPage />} />
              <Route path="admin/variants/:variantId/price"       element={<AdminVariantPricePage />} />
              {/* UC-NOT-07 — Compositor de notificacion manual */}
              <Route path="admin/notifications/compose"           element={<AdminNotificationComposePage />} />
              {/* UC-DASH-01..04 — Descuentos de producto */}
              <Route path="admin/product-discounts"               element={<AdminProductDiscountsPage />} />
              {/* UC-REP-01 — Reporte de ingresos y ventas */}
              <Route path="admin/reports/sales"                   element={<AdminReportSalesPage />} />
              {/* UC-REP-02 — Reporte top sellers */}
              <Route path="admin/reports/top-sellers"             element={<AdminReportTopSellersPage />} />
              {/* UC-REP-04 — Reporte de clientes (RFM) */}
              <Route path="admin/reports/customers-rfm"           element={<AdminReportCustomersRfmPage />} />
              {/* UC-REP-03 — Dashboard analitico */}
              <Route path="admin/reports"                         element={<AdminReportDashboardPage />} />
              {/* UC-COM-02 / UC-COM-03 — Bandeja y respuesta de contacto */}
              <Route path="admin/contact/messages"                element={<AdminContactMessagesPage />} />
              <Route path="admin/contact/messages/:id"            element={<AdminContactMessageDetailPage />} />
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
