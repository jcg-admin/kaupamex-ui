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
import { fetchAdminUsers, setPage } from '@redux/slices/adminSlice';
import { MetaTag, Button } from '@components/common/primitives';
import { DataTable } from '@components/common';
import Avatar from '@components/common/Avatar/Avatar';
import SegmentedControl from '@components/common/SegmentedControl/SegmentedControl';
import Icon from '@components/common/Icon/Icon';
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

/**
 * Convierte los filtros locales de la UI a los parámetros que
 * espera la API (AdminUserViewSet.get_queryset):
 *   - role   → is_staff (bool string) o sin filtro
 *   - status → is_active (bool string) + deactivated_reason opcional
 *
 * Bug H-CICLO30-01a: el código anterior enviaba `role` y `status`
 * directamente al backend, que los ignoraba por completo porque
 * espera `is_staff`, `is_active` y `deactivated_reason`.
 */
function buildApiParams({ role, status, search }) {
  const params = {};
  if (search) params.search = search;

  // Rol → is_staff
  if (role === 'customer') {
    params.is_staff = 'false';
  } else if (role === 'admin' || role === 'staff') {
    params.is_staff = 'true';
  }

  // Estado → is_active + deactivated_reason
  if (status === 'active') {
    params.is_active = 'true';
  } else if (status === 'unverified') {
    params.is_active = 'false';
    params.deactivated_reason = 'unverified';
  } else if (status === 'inactive') {
    params.is_active = 'false';
  }

  return params;
}

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const users = useSelector((s) => s.admin?.users || []);
  // Bug H-CICLO30-01b: isLoadingUsers no existe en el slice; la clave real es isLoading.
  const isLoading = useSelector((s) => s.admin?.isLoading);
  const pagination = useSelector((s) => s.admin?.pagination || {});
  const currentPage = pagination.page || 1;
  const totalPages  = pagination.totalPages || 0;
  const totalCount  = pagination.count || 0;

  useEffect(() => {
    dispatch(fetchAdminUsers({ ...buildApiParams({ role, status, search }), page: currentPage }));
  }, [dispatch, role, status, search, currentPage]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Comunidad · {totalCount || users.length} usuarios</MetaTag>
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
          <SegmentedControl
            ariaLabel="Filtrar por rol"
            data={ROLE_FILTERS.map((r) => ({ value: r.id, label: r.label }))}
            value={role}
            onChange={setRole}
          />
        </div>
        <div className={styles.filters}>
          <span style={{ fontFamily: 'var(--f-mono)', fontSize: 10, color: 'var(--c-ink-mute)', letterSpacing: '0.12em', paddingTop: 8, marginRight: 8 }}>ESTADO:</span>
          <SegmentedControl
            ariaLabel="Filtrar por estado"
            data={STATUS_FILTERS.map((s) => ({ value: s.id, label: s.label }))}
            value={status}
            onChange={setStatus}
          />
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
        <DataTable
          columns={[
            { key: 'avatar',       header: '',
              render: (u) => (
                <Avatar
                  className={styles.avatarSm}
                  src={u.avatar_url}
                  initials={(u.first_name?.[0] || '') + (u.last_name?.[0] || '')}
                />
              ) },
            { key: 'name',         header: 'Usuario',
              render: (u) => (
                <>
                  <Link to={`/admin/users/${u.id}`} className={styles.itemName}>
                    {u.first_name} {u.last_name}
                  </Link>
                  <div className={styles.muted}>@{u.username}</div>
                </>
              ) },
            { key: 'email',        header: 'Correo',    sortable: true },
            { key: 'rol',          header: 'Rol',
              render: (u) => (
                <span className={`${styles.statusPill} ${styles[`pill_${u.is_admin ? 'bronze' : u.is_staff ? 'coral' : 'muted'}`]}`}>
                  {u.is_admin ? 'Admin' : u.is_staff ? 'Staff' : 'Comprador'}
                </span>
              ) },
            { key: 'estado',       header: 'Estado',
              render: (u) => (
                <span className={`${styles.statusPill} ${styles[`pill_${u.is_active ? (u.email_verified ? 'lime' : 'bronze') : 'vino'}`]}`}>
                  {!u.is_active ? 'Inactivo' : !u.email_verified ? 'Sin verificar' : 'Activo'}
                </span>
              ) },
            { key: 'order_count',  header: 'Pedidos',   sortable: true },
            { key: 'last_login',   header: 'Última actividad',
              render: (u) => u.last_login
                ? new Date(u.last_login).toLocaleDateString('es-MX')
                : '—' },
            { key: 'actions',      header: '',
              render: (u) => (
                <Link to={`/admin/users/${u.id}`} className={styles.actionBtn} title="Ver" aria-label="Ver"><Icon name="arrow-right" size={16} /></Link>
              ) },
          ]}
          rows={users}
          rowKey={(u) => u.id}
          loading={isLoading}
          emptyText="Sin usuarios que coincidan"
          caption="Listado de usuarios"
          pageSize={0}
        />
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => dispatch(setPage(currentPage - 1))}
          >
            ← Anterior
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              type="button"
              variant={p === currentPage ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => dispatch(setPage(p))}
            >
              {p}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => dispatch(setPage(currentPage + 1))}
          >
            Siguiente →
          </Button>
        </div>
      )}
    </div>
  );
}
