/**
 * AdminSidebar — Práctica Yorùbà
 * Navegación lateral del panel administrativo.
 */

import { NavLink } from 'react-router-dom';
import logoUrl from '@assets/practica-yoruba-logo.png';
import styles from './AdminSidebar.module.scss';

const ADMIN_NAV = [
  { section: 'Operación', items: [
    { to: '/admin',           label: 'Resumen',         end: true },
    { to: '/admin/pedidos',   label: 'Pedidos' },
    { to: '/admin/productos', label: 'Productos' },
    { to: '/admin/inventario', label: 'Inventario' },
  ]},
  { section: 'Comunidad', items: [
    { to: '/admin/usuarios',  label: 'Usuarios' },
    { to: '/admin/vouchers',  label: 'Vouchers' },
  ]},
  { section: 'Configuración', items: [
    { to: '/admin/categorias', label: 'Categorías' },
    { to: '/admin/ajustes',    label: 'Ajustes del sitio' },
  ]},
];

export default function AdminSidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <img src={logoUrl} alt="" className={styles.brandLogo} />
        <div>
          <div className={styles.brandName}>Práctica Yorùbà</div>
          <div className={styles.brandTag}>Panel administrativo</div>
        </div>
      </div>

      <nav className={styles.nav}>
        {ADMIN_NAV.map((group) => (
          <div key={group.section} className={styles.group}>
            <h4 className={styles.groupTitle}>{group.section}</h4>
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.linkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className={styles.footer}>
        <NavLink to="/" className={styles.exitLink}>← Ir al storefront</NavLink>
      </div>
    </aside>
  );
}
