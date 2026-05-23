/**
 * AdminUserDetailPage — Práctica Yorùbà (re-skin)
 * Detalle de un usuario con datos personales, pedidos, direcciones y acciones admin.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams } from 'react-router-dom';
import {
  fetchAdminUser, toggleUserActive, resetUserPassword, makeUserAdmin,
} from '@redux/slices/adminSlice';
import { MetaTag, Price, Button } from '@components/common/primitives';
import styles from './AdminUserDetailPage.module.scss';

export default function AdminUserDetailPage() {
  const { pk } = useParams();
  const dispatch = useDispatch();
  const user = useSelector((s) => s.admin?.currentUser);
  const isLoading = useSelector((s) => s.admin?.isLoadingUser);

  useEffect(() => { dispatch(fetchAdminUser(pk)); }, [dispatch, pk]);

  if (isLoading || !user) {
    return <div className={styles.loading}>Cargando usuario…</div>;
  }

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <Link to="/admin">Admin</Link><span>/</span>
        <Link to="/admin/users">Usuarios</Link><span>/</span>
        <span className={styles.bcCurrent}>{user.first_name} {user.last_name}</span>
      </nav>

      <header className={styles.hero}>
        <div className={styles.avatar}>
          {user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}
        </div>
        <div className={styles.heroInfo}>
          <MetaTag tone="bronze">@{user.username} · ID #{user.id}</MetaTag>
          <h1 className={styles.heroTitle}>{user.first_name} {user.last_name}</h1>
          <div className={styles.heroMeta}>
            {user.email} · Cliente desde {new Date(user.date_joined).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
          </div>
          <div className={styles.statusRow}>
            <span className={`${styles.statusPill} ${styles[`pill_${user.is_admin ? 'bronze' : user.is_staff ? 'coral' : 'muted'}`]}`}>
              {user.is_admin ? 'Admin' : user.is_staff ? 'Staff' : 'Comprador'}
            </span>
            <span className={`${styles.statusPill} ${styles[`pill_${user.is_active ? (user.email_verified ? 'lime' : 'bronze') : 'vino'}`]}`}>
              {!user.is_active ? 'Inactivo' : !user.email_verified ? 'Sin verificar' : 'Activo'}
            </span>
          </div>
        </div>
        <div className={styles.heroActions}>
          <Button variant="secondary" onClick={() => dispatch(resetUserPassword(user.id))}>
            Forzar reset de contraseña
          </Button>
          <Button
            variant={user.is_active ? 'secondary' : 'primary'}
            onClick={() => dispatch(toggleUserActive(user.id))}
          >
            {user.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
          </Button>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Stats */}
        <section className={styles.statsCard}>
          <Stat label="Pedidos totales" value={user.order_count || 0} />
          <Stat label="Pedidos entregados" value={user.delivered_count || 0} tone="lime" />
          <Stat label="Pedidos cancelados" value={user.cancelled_count || 0} tone="vino" />
          <Stat label="Total gastado" value={`$${(user.lifetime_value || 0).toLocaleString('es-MX')}`} tone="bronze" />
        </section>

        {/* Personal data */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Datos personales</h2>
          </header>
          <dl className={styles.dataList}>
            <DataRow k="Nombre"            v={`${user.first_name} ${user.last_name}`} />
            <DataRow k="Usuario"           v={`@${user.username}`} />
            <DataRow k="Correo"            v={user.email} />
            <DataRow k="Teléfono"          v={user.phone || '—'} />
            <DataRow k="Fecha de nacimiento" v={user.date_of_birth || '—'} />
            <DataRow k="Última conexión"    v={user.last_login ? new Date(user.last_login).toLocaleString('es-MX') : '—'} />
          </dl>
        </section>

        {/* Addresses */}
        <section className={styles.card}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Direcciones ({user.addresses?.length || 0}/5)</h2>
          </header>
          <div className={styles.addresses}>
            {(user.addresses || []).map((a) => (
              <div key={a.id} className={`${styles.address} ${a.is_default ? styles.addressDefault : ''}`}>
                <div className={styles.addressAlias}>
                  {a.alias}
                  {a.is_default && <MetaTag tone="lime">Predeterminada</MetaTag>}
                </div>
                <div className={styles.addressBody}>
                  {a.recipient_name}<br />
                  {a.street}<br />
                  {a.colony}, {a.city}, {a.state} {a.zip_code}
                </div>
              </div>
            ))}
            {(!user.addresses || user.addresses.length === 0) && (
              <div className={styles.empty}>Sin direcciones registradas</div>
            )}
          </div>
        </section>

        {/* Recent orders */}
        <section className={styles.card} style={{ gridColumn: '1 / -1' }}>
          <header className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Pedidos recientes</h2>
            <Link to={`/admin/orders?user=${user.id}`} className={styles.cardLink}>
              Ver todos →
            </Link>
          </header>
          <table className={styles.ordersTable}>
            <thead>
              <tr>
                <th>Número</th>
                <th>Fecha</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {(user.recent_orders || []).map((o) => (
                <tr key={o.order_number}>
                  <td><Link to={`/admin/orders/${o.order_number}`}>{o.order_number}</Link></td>
                  <td>{new Date(o.created_at).toLocaleDateString('es-MX')}</td>
                  <td>{o.item_count}</td>
                  <td><Price amount={o.total} size="sm" /></td>
                  <td>
                    <span className={`${styles.statusPill} ${styles[`pill_${o.tone || 'muted'}`]}`}>
                      {o.status_label}
                    </span>
                  </td>
                </tr>
              ))}
              {(!user.recent_orders || user.recent_orders.length === 0) && (
                <tr><td colSpan={5} className={styles.empty}>Sin pedidos</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = 'default' }) {
  const toneClass = {
    default: '',
    lime:    styles.statLime,
    coral:   styles.statCoral,
    vino:    styles.statVino,
    bronze:  styles.statBronze,
  }[tone];
  return (
    <div className={styles.stat}>
      <div className={styles.statLabel}>{label}</div>
      <div className={`${styles.statValue} ${toneClass}`}>{value}</div>
    </div>
  );
}

function DataRow({ k, v }) {
  return (
    <div className={styles.dataRow}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
