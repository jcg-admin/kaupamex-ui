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
// UC-CAT-08 — Arbol publico de categorias
const CategoryListPage = lazy(() => import('@pages/catalog/CategoryListPage'));
// UC-CAT-03 + UC-CAT-03-EXT — Pagina dedicada de resultados de busqueda
const SearchResultsPage = lazy(() => import('@pages/catalog/SearchResultsPage'));
const CartPage        = lazy(() => import('@pages/cart/CartPage'));
const CheckoutPage    = lazy(() => import('@pages/checkout/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('@pages/checkout/OrderSuccessPage'));
const PaymentSelectionPage = lazy(() => import('@pages/checkout/PaymentSelectionPage'));

// Lazy pages — Comms publicas (contacto, newsletter, preguntas)
const ContactPage               = lazy(() => import('@pages/ContactPage'));
const NewsletterSubscribePage   = lazy(() => import('@pages/NewsletterSubscribePage'));
const NewsletterUnsubscribePage = lazy(() => import('@pages/NewsletterUnsubscribePage'));
const ProductQuestionAskPage    = lazy(() => import('@pages/catalog/ProductQuestionAskPage'));
const ProductQuestionsListPage  = lazy(() => import('@pages/catalog/ProductQuestionsListPage'));
const ProductReviewsListPage    = lazy(() => import('@pages/catalog/ProductReviewsListPage'));

// Lazy pages — Auth
const LoginPage       = lazy(() => import('@pages/auth/LoginPage'));
const RegisterPage    = lazy(() => import('@pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('@pages/auth/ResetPasswordPage'));
const VerifyEmailPage    = lazy(() => import('@pages/auth/VerifyEmailPage'));

// Lazy pages — Cuenta del comprador
const AccountPage     = lazy(() => import('@pages/account/AccountPage'));
const OrdersPage      = lazy(() => import('@pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('@pages/account/OrderDetailPage'));
const WishlistPage    = lazy(() => import('@pages/account/WishlistPage'));
const ProfilePage     = lazy(() => import('@pages/account/ProfilePage'));
const ChangePasswordPage = lazy(() => import('@pages/account/ChangePasswordPage'));
const AddressesPage      = lazy(() => import('@pages/account/AddressesPage'));
// UC-SRCH-03 — Historial personal de busquedas
const SearchHistoryPage  = lazy(() => import('@pages/account/SearchHistoryPage'));

// Lazy pages — Soporte (tickets del comprador)
const SupportTicketsPage       = lazy(() => import('@pages/account/SupportTicketsPage'));
const SupportTicketCreatePage  = lazy(() => import('@pages/account/SupportTicketCreatePage'));
const SupportTicketDetailPage  = lazy(() => import('@pages/account/SupportTicketDetailPage'));

// Lazy pages — Devoluciones (comprador)
const ReturnsPage             = lazy(() => import('@pages/account/ReturnsPage'));
const ReturnCreatePage        = lazy(() => import('@pages/account/ReturnCreatePage'));
const ReturnDetailPage        = lazy(() => import('@pages/account/ReturnDetailPage'));
const ProductReviewCreatePage = lazy(() => import('@pages/account/ProductReviewCreatePage'));

// Lazy pages — Notificaciones (comprador)
const NotificationPreferencesPage = lazy(() => import('@pages/account/NotificationPreferencesPage'));
const PaymentStatusPage    = lazy(() => import('@pages/account/PaymentStatusPage'));
const PaymentHistoryPage   = lazy(() => import('@pages/account/PaymentHistoryPage'));
const PaymentRetryPage     = lazy(() => import('@pages/account/PaymentRetryPage'));

// Lazy pages — Admin
const AdminDashboardPage  = lazy(() => import('@pages/admin/AdminDashboardPage'));
const AdminProductsPage   = lazy(() => import('@pages/admin/AdminProductsPage'));
const AdminOrdersPage     = lazy(() => import('@pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('@pages/admin/AdminOrderDetailPage'));
const AdminOrdersDashboardPage = lazy(() => import('@pages/admin/AdminOrdersDashboardPage'));
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
const AdminNewsletterSubscribersPage = lazy(() => import('@pages/admin/AdminNewsletterSubscribersPage'));
const AdminNewsletterComposePage     = lazy(() => import('@pages/admin/AdminNewsletterComposePage'));
const AdminQuestionsAnswerPage       = lazy(() => import('@pages/admin/AdminQuestionsAnswerPage'));
const AdminQuestionsModerationPage   = lazy(() => import('@pages/admin/AdminQuestionsModerationPage'));
const AdminReviewsModerationPage     = lazy(() => import('@pages/admin/AdminReviewsModerationPage'));
const AdminPaymentRefundPage         = lazy(() => import('@pages/admin/AdminPaymentRefundPage'));
const AdminPaymentsPage              = lazy(() => import('@pages/admin/AdminPaymentsPage'));
// UC-CAT-06 / UC-CAT-09 / UC-CAT-10 — Categorias y CRUD de productos
const AdminCategoriesPage            = lazy(() => import('@pages/admin/AdminCategoriesPage'));
const AdminProductCreatePage         = lazy(() => import('@pages/admin/AdminProductCreatePage'));
const AdminProductEditPage           = lazy(() => import('@pages/admin/AdminProductEditPage'));
// UC-CAT-12 — Sincronizacion masiva de precios (CSV / ajuste porcentual)
const AdminPriceSyncPage             = lazy(() => import('@pages/admin/AdminPriceSyncPage'));
// UC-ADM-02..05 — Permisos, auditoria, settings, backups
const AdminPermissionsPage           = lazy(() => import('@pages/admin/AdminPermissionsPage'));
const AdminAuditLogPage              = lazy(() => import('@pages/admin/AdminAuditLogPage'));
const AdminSystemSettingsPage        = lazy(() => import('@pages/admin/AdminSystemSettingsPage'));
const AdminBackupsPage               = lazy(() => import('@pages/admin/AdminBackupsPage'));
// UC-LOG-08 — Panel operacional de logistica
const AdminLogisticsPage             = lazy(() => import('@pages/admin/AdminLogisticsPage'));
// UC-CFG-01..05 — Hub de configuracion
const AdminConfigPage                = lazy(() => import('@pages/admin/AdminConfigPage'));

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
            {/* UC-CAT-08 — Arbol publico de categorias */}
            <Route path="categories" element={<CategoryListPage />} />
            {/* UC-CAT-03 + UC-CAT-03-EXT — Resultados de busqueda */}
            <Route path="search" element={<SearchResultsPage />} />
            <Route path="catalog/:slug" element={<ProductPage />} />
            <Route path="cart" element={<CartPage />} />
            {/* UC-COM-01 — Formulario publico de contacto */}
            <Route path="contact" element={<ContactPage />} />
            {/* UC-NEW-01 — Suscripcion publica al newsletter */}
            <Route path="newsletter" element={<NewsletterSubscribePage />} />
            {/* UC-NEW-02 — Desuscripcion via token firmado */}
            <Route path="newsletter/unsubscribe" element={<NewsletterUnsubscribePage />} />
            {/* UC-QST-01 — Hacer pregunta sobre producto */}
            <Route path="catalog/:productId/ask" element={<ProductQuestionAskPage />} />
            {/* UC-QST-02 — Listado publico de preguntas con respuesta */}
            <Route path="catalog/:productId/questions" element={<ProductQuestionsListPage />} />
            {/* UC-REV-02 — Listado publico de resenas aprobadas */}
            <Route path="catalog/:productId/reviews" element={<ProductReviewsListPage />} />
          </Route>

          {/* ─── Auth ─── */}
          <Route path="auth">
            <Route path="login"                    element={<LoginPage />} />
            <Route path="register"                 element={<RegisterPage />} />
            <Route path="forgot-password"          element={<ForgotPasswordPage />} />
            <Route path="reset-password/:uid/:token" element={<ResetPasswordPage />} />
            {/* UC-AUTH-10 — Verificar email (token en query string) */}
            <Route path="verify-email"             element={<VerifyEmailPage />} />
          </Route>

          {/* ─── Checkout ─── */}
          {/*
           * UC-ORD-01 permite invitado: el endpoint POST /api/v1/checkout/
           * acepta carrito anonimo + datos de contacto + direccion sin JWT.
           * Por eso /checkout y la confirmacion quedan publicas; la
           * seleccion de gateway tambien (necesaria para invitados).
           */}
          <Route element={<StorefrontLayout />}>
            <Route path="checkout" element={<CheckoutPage />} />
            {/* UC-PAY-01 / UC-PAY-02 — Seleccion de gateway de pago */}
            <Route path="checkout/payment/:orderId" element={<PaymentSelectionPage />} />
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
              {/* UC-AUTH-08 — Cambiar contrasena */}
              <Route path="account/change-password" element={<ChangePasswordPage />} />
              {/* UC-AUTH-07 — Libreta de direcciones */}
              <Route path="account/addresses"   element={<AddressesPage />} />
              {/* UC-SRCH-03 — Historial personal de busquedas */}
              <Route path="account/search-history" element={<SearchHistoryPage />} />
              <Route path="account/returns"     element={<ReturnsPage />} />
              <Route path="account/returns/new" element={<ReturnCreatePage />} />
              <Route path="account/returns/:id" element={<ReturnDetailPage />} />
              {/* UC-REV-01 — Dejar resena del producto comprado */}
              <Route
                path="account/orders/:orderId/products/:productId/review"
                element={<ProductReviewCreatePage />}
              />
              <Route path="account/notifications/preferences" element={<NotificationPreferencesPage />} />
              {/* UC-PAY-05 — Estado actual del pago de una orden propia */}
              <Route path="account/orders/:orderId/payment" element={<PaymentStatusPage />} />
              {/* UC-PAY-06 — Historial de pagos de una orden propia */}
              <Route path="account/orders/:orderId/payments" element={<PaymentHistoryPage />} />
              {/* UC-PAY-08 — Reintentar pago fallido */}
              <Route path="account/orders/:orderId/payment/retry" element={<PaymentRetryPage />} />
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
              <Route path="admin/products"           element={<AdminProductsPage />} />
              {/* UC-CAT-09 — Crear producto */}
              <Route path="admin/products/new"       element={<AdminProductCreatePage />} />
              {/* UC-CAT-10 — Editar producto */}
              <Route path="admin/products/:id/edit"  element={<AdminProductEditPage />} />
              {/* UC-CAT-06 — Gestionar categorias */}
              <Route path="admin/categories"         element={<AdminCategoriesPage />} />
              {/* UC-CAT-12 — Sincronizar precios en lote */}
              <Route path="admin/price-sync"         element={<AdminPriceSyncPage />} />
              {/* UC-ADM-02 — Matriz de permisos */}
              <Route path="admin/permissions"        element={<AdminPermissionsPage />} />
              {/* UC-ADM-03 — Auditoria */}
              <Route path="admin/audit-log"          element={<AdminAuditLogPage />} />
              {/* UC-ADM-04 — Configuracion del sistema */}
              <Route path="admin/system-settings"    element={<AdminSystemSettingsPage />} />
              {/* UC-ADM-05 — Backups */}
              <Route path="admin/backups"            element={<AdminBackupsPage />} />
              <Route path="admin/orders"      element={<AdminOrdersPage />} />
              {/* UC-ORD-07 / UC-ORD-08 — Detalle admin con transicion y cancelacion */}
              <Route path="admin/orders/:id"  element={<AdminOrderDetailPage />} />
              {/* UC-ORD-10 — Dashboard transaccional */}
              <Route path="admin/orders-dashboard" element={<AdminOrdersDashboardPage />} />
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
              {/* UC-NEW-03 — Gestion de suscriptores */}
              <Route path="admin/newsletter/subscribers"          element={<AdminNewsletterSubscribersPage />} />
              {/* UC-NEW-04 — Compositor de campana newsletter */}
              <Route path="admin/newsletter/compose"              element={<AdminNewsletterComposePage />} />
              {/* UC-QST-03 — Cola de respuesta */}
              <Route path="admin/questions/answer"                element={<AdminQuestionsAnswerPage />} />
              {/* UC-QST-04 — Cola de moderacion */}
              <Route path="admin/questions/moderation"            element={<AdminQuestionsModerationPage />} />
              {/* UC-REV-03 — Cola de moderacion de resenas */}
              <Route path="admin/reviews/moderation"              element={<AdminReviewsModerationPage />} />
              {/* UC-PAY-11 — Reporte de transacciones de pago */}
              <Route path="admin/payments"                        element={<AdminPaymentsPage />} />
              {/* UC-PAY-09 — Procesar reembolso manual */}
              <Route path="admin/payments/:paymentId/refund"      element={<AdminPaymentRefundPage />} />
              {/* UC-LOG-08 — Panel operacional de logistica */}
              <Route path="admin/logistics"                       element={<AdminLogisticsPage />} />
              {/* UC-CFG-01..05 — Hub de configuracion */}
              <Route path="admin/config"                          element={<AdminConfigPage />} />
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
