/**
 * AdminUsersPage — Práctica Yorùbà (re-skin)
 * Tabla de usuarios con filtros + búsqueda + creación + edición.
 * Reusa los estilos compartidos de AdminTablePage.module.scss.
 *
 * Mantén tu lógica Redux existente; solo cambia la presentación.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAdminUsers } from '@redux/slices/adminSlice';
import { MetaTag, Button } from '@components/common/primitives';
import styles from './AdminTablePage.module.scss';

const ROLE_FILTERS = [
  { id: 'all',      label: 'Todos' },
  { id: 'customer', label: 'Compradores' },
  { id: 'admin',    label: 'Administradores' },
  { id: 'staff',    label: 'Staff' },
];

const STATUS_FILTERS = [
  { id: 'active',     label: 'Activos' },
  { id: 'unverified', label: 'Sin verificar' },
  { id: 'inactive',   label: 'Inactivos' },
];

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const users = useSelector((s) => s.admin?.users || []);
  const isLoading = useSelector((s) => s.admin?.isLoading);

  useEffect(() => {
    dispatch(fetchAdminUsers({ role, status, search }));
  }, [dispatch, role, status, search]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Comunidad · {users.length} usuarios</MetaTag>
          <h1 className={styles.title}>Usuarios</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">Exportar CSV</Button>
          <Button variant="primary">+ Nuevo admin</Button>
        </div>
      </header>

      <div className={styles.toolbar} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div className={styles.filters}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--c-ink-mute)', letterSpacing: '0.12em', paddingTop: 8, marginRight: 8 }}>ROL:</span>
          {ROLE_FILTERS.map((r) => (
            <button
              key={r.id}
              className={`${styles.filterBtn} ${role === r.id ? styles.filterBtnActive : ''}`}
              onClick={() => setRole(r.id)}
            >{r.label}</button>
          ))}
        </div>
        <div className={styles.filters}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--c-ink-mute)', letterSpacing: '0.12em', paddingTop: 8, marginRight: 8 }}>ESTADO:</span>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              className={`${styles.filterBtn} ${status === s.id ? styles.filterBtnActive : ''}`}
              onClick={() => setStatus(s.id)}
            >{s.label}</button>
          ))}
          <input
            type="search"
            placeholder="Buscar por nombre o correo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.search}
            style={{ marginLeft: 'auto' }}
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: 50 }}></th>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Pedidos</th>
              <th>Última actividad</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={8} className={styles.loading}>Cargando usuarios…</td></tr>}
            {!isLoading && users.length === 0 && (
              <tr><td colSpan={8} className={styles.empty}>Sin usuarios que coincidan</td></tr>
            )}
            {!isLoading && users.map((u) => (
              <tr key={u.id}>
                <td className={styles.thumbCol}>
                  <div className={styles.avatarSm}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" />
                      : <span>{(u.first_name?.[0] || '')+(u.last_name?.[0] || '')}</span>
                    }
                  </div>
                </td>
                <td>
                  <Link to={`/admin/users/${u.id}`} className={styles.itemName}>
                    {u.first_name} {u.last_name}
                  </Link>
                  <div className={styles.muted}>@{u.username}</div>
                </td>
                <td>{u.email}</td>
                <td>
                  <span className={`${styles.statusPill} ${styles[`pill_${u.is_admin ? 'bronze' : u.is_staff ? 'coral' : 'muted'}`]}`}>
                    {u.is_admin ? 'Admin' : u.is_staff ? 'Staff' : 'Comprador'}
                  </span>
                </td>
                <td>
                  <span className={`${styles.statusPill} ${styles[`pill_${u.is_active ? (u.email_verified ? 'lime' : 'bronze') : 'vino'}`]}`}>
                    {!u.is_active ? 'Inactivo' : !u.email_verified ? 'Sin verificar' : 'Activo'}
                  </span>
                </td>
                <td className={`${styles.right} ${styles.mono}`}>{u.order_count}</td>
                <td className={styles.mono}>
                  {u.last_login ? new Date(u.last_login).toLocaleDateString('es-MX') : '—'}
                </td>
                <td className={styles.actions}>
                  <Link to={`/admin/users/${u.id}`} className={styles.actionBtn} title="Ver">→</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
