/**
 * AdminLayout — PracticaYoruba
 * Layout del panel admin: sidebar oscuro + header + contenido.
 * Acceso exclusivo para is_staff = true.
 */

import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { selectUser } from '@redux/selectors';
import { logoutUser } from '@redux/slices/authSlice';
import { closeSidebar, openSidebar, selectIsSidebarOpen } from '@redux/slices/uiSlice';
import ToastContainer from '@components/common/Toast/ToastContainer';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import Icon from '@components/common/Icon/Icon';
import styles from './AdminLayout.module.scss';

// H-10 (Fase 4): navegación agrupada en secciones colapsables. Cada grupo
// puede plegarse/desplegarse; abiertos por defecto para no ocultar destinos.
const ADMIN_NAV = [
  { section: 'Principal', items: [
    { to: '/admin', label: 'Dashboard', end: true },
  ] },
  // Variantes (chartsize) viven bajo /admin/products/:productId/variants —
  // se accede desde el detalle del producto, no es entrada del sidebar.
  { section: 'Catálogo', items: [
    { to: '/admin/products',     label: 'Productos' },
    { to: '/admin/products/new', label: 'Crear Producto' },
    { to: '/admin/categories',   label: 'Categorías' },
  ] },
  { section: 'Ventas', items: [
    { to: '/admin/orders',    label: 'Pedidos' },
    { to: '/admin/payments',  label: 'Pagos' },
    { to: '/admin/returns',   label: 'Devoluciones' },
    { to: '/admin/vouchers',  label: 'Cupones' },
  ] },
  { section: 'Clientes', items: [
    { to: '/admin/users',       label: 'Usuarios' },
    { to: '/admin/permissions', label: 'Permisos' },
    { to: '/admin/support',     label: 'Soporte (Tickets)' },
  ] },
  { section: 'Operaciones', items: [
    { to: '/admin/inventory',            label: 'Inventario' },
    { to: '/admin/logistics',            label: 'Logística' },
    { to: '/admin/shipping-zones',       label: 'Zonas de entrega' },
    { to: '/admin/reports',              label: 'Reportes: Dashboard', end: true },
    { to: '/admin/reports/sales',        label: 'Reportes: Ventas' },
    { to: '/admin/reports/top-sellers',  label: 'Reportes: Top sellers' },
    { to: '/admin/reports/customers-rfm', label: 'Reportes: Clientes RFM' },
  ] },
  { section: 'Configuración', items: [
    { to: '/admin/config',          label: 'Configuración' },
    { to: '/admin/system-settings', label: 'Configuración Sistema' },
    { to: '/admin/audit-log',       label: 'Auditoría' },
    { to: '/admin/backups',         label: 'Backups' },
  ] },
];

export default function AdminLayout() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const user       = useSelector(selectUser);
  const isSidebarOpen = useSelector(selectIsSidebarOpen);
  // H-10: secciones colapsadas. Vacío = todas abiertas (destinos visibles).
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (name) =>
    setCollapsed((c) => ({ ...c, [name]: !c[name] }));

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/auth/login');
  };

  return (
    <div className={styles.root}>
      {/* Overlay mobile */}
      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => dispatch(closeSidebar())}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.brand}>
          <span className={styles.brandName}>PracticaYoruba</span>
          <span className={styles.brandLabel}>Admin</span>
        </div>

        <nav className={styles.nav}>
          {ADMIN_NAV.map((group) => {
            const isCollapsed = Boolean(collapsed[group.section]);
            return (
              <div key={group.section} className={styles.navGroup}>
                <button
                  type="button"
                  className={styles.navSection}
                  onClick={() => toggleSection(group.section)}
                  aria-expanded={!isCollapsed}
                >
                  {group.section}
                  <Icon
                    name={isCollapsed ? 'chevron-right' : 'chevron-down'}
                    size={14}
                    className={styles.navCaret}
                  />
                </button>
                {!isCollapsed && group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                    }
                    onClick={() => dispatch(closeSidebar())}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link to="/" className={styles.viewStore}>
            <Icon name="arrow-left" size={16} /> Ver tienda
          </Link>
          <p className={styles.adminName}>
            {user?.first_name} {user?.last_name}
          </p>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <div className={styles.content}>
        {/* Header del admin */}
        <header className={styles.header}>
          <button
            className={styles.menuBtn}
            onClick={() => dispatch(isSidebarOpen ? closeSidebar() : openSidebar())}
            aria-label="Abrir menú"
          >
            <Icon name="menu" size={22} />
          </button>
          <span className={styles.headerTitle}>Panel de administración</span>
          <div className={styles.headerUser}>
            {user?.email}
          </div>
        </header>

        {/* Área de página */}
        <main className={styles.main}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
