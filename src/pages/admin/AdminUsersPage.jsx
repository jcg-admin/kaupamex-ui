/**
 * AdminUsersPage — PracticaYoruba
 * UC-AUTH-11: Listado de usuarios con búsqueda y paginación
 * UC-AUTH-15: Crear usuario administrador (modal)
 */
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchAdminUsers, createAdminUser,
  setSearch, clearActionState,
} from '@redux/slices/adminSlice';
import {
  changeUserRole, clearAdminUsersActionState,
} from '@redux/slices/adminUsersSlice';
import styles from './AdminUsersPage.module.scss';

// =============================================================================
// Modal — Crear administrador (UC-AUTH-15)
// =============================================================================

function CreateAdminModal({ onClose, onCreated }) {
  const dispatch = useDispatch();
  const { isActioning, actionError } = useSelector((s) => s.admin);
  const [fields, setFields] = useState({ username: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!fields.username.trim()) e.username = 'El usuario es obligatorio.';
    if (!fields.email.trim())    e.email    = 'El email es obligatorio.';
    if (!fields.password)        e.password = 'La contraseña es obligatoria.';
    return e;
  };

  const handleChange = (e) => {
    setFields((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((p) => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    const result = await dispatch(createAdminUser(fields));
    if (createAdminUser.fulfilled.match(result)) {
      onCreated?.();
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Nuevo Administrador"
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <header className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nuevo Administrador</h2>
          <button
            type="button"
            className={styles.modalClose}
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </header>

        <form onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label htmlFor="new-username" className={styles.label}>Usuario</label>
            <input
              id="new-username"
              name="username"
              type="text"
              className={styles.input}
              value={fields.username}
              onChange={handleChange}
              autoComplete="off"
            />
            {errors.username && <p className={styles.fieldError}>{errors.username}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="new-email" className={styles.label}>Email</label>
            <input
              id="new-email"
              name="email"
              type="email"
              className={styles.input}
              value={fields.email}
              onChange={handleChange}
              autoComplete="off"
            />
            {errors.email && <p className={styles.fieldError}>{errors.email}</p>}
          </div>

          <div className={styles.field}>
            <label htmlFor="new-password" className={styles.label}>Contraseña</label>
            <input
              id="new-password"
              name="password"
              type="password"
              className={styles.input}
              value={fields.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && <p className={styles.fieldError}>{errors.password}</p>}
          </div>

          {actionError && (
            <p className={styles.apiError} role="alert">{actionError}</p>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={isActioning}
            >
              {isActioning ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =============================================================================
// Página principal
// =============================================================================

export default function AdminUsersPage() {
  const dispatch = useDispatch();
  const { users, isLoading, error, pagination, search } =
    useSelector((s) => s.admin);

  const [localSearch, setLocalSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const adminUsersState = useSelector((s) => s.adminUsers ?? { isActioning: false });

  useEffect(() => {
    dispatch(fetchAdminUsers());
  }, [dispatch]);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    dispatch(setSearch(localSearch));
    const params = { search: localSearch };
    if (roleFilter !== 'all') params.role = roleFilter;
    dispatch(fetchAdminUsers(params));
  }, [dispatch, localSearch, roleFilter]);

  const handleRoleChange = useCallback(async (user, newRole) => {
    if (newRole === (user.is_staff ? 'admin' : 'buyer')) return;
    const result = await dispatch(changeUserRole({ id: user.id, role: newRole }));
    if (changeUserRole.fulfilled.match(result)) {
      dispatch(clearAdminUsersActionState());
      const params = { search: localSearch };
      if (roleFilter !== 'all') params.role = roleFilter;
      dispatch(fetchAdminUsers(params));
    }
  }, [dispatch, localSearch, roleFilter]);

  const handleCreated = useCallback(() => {
    dispatch(clearActionState());
    dispatch(fetchAdminUsers({ search: localSearch }));
  }, [dispatch, localSearch]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestión de Usuarios</h1>
        <button
          type="button"
          className={styles.btnPrimary}
          onClick={() => setShowCreateModal(true)}
        >
          Nuevo Administrador
        </button>
      </header>

      {/* Búsqueda */}
      <form
        className={styles.searchBar}
        onSubmit={handleSearch}
        role="search"
        aria-label="Buscar usuarios"
      >
        <input
          type="search"
          className={styles.searchInput}
          placeholder="Buscar por usuario, email o nombre…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          aria-label="Buscar usuarios"
        />
        <label className={styles.roleFilter}>
          <span>Rol</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filtrar por rol"
          >
            <option value="all">Todos</option>
            <option value="admin">Administrador</option>
            <option value="buyer">Comprador</option>
          </select>
        </label>
        <button type="submit" className={styles.btnSecondary}>
          Buscar
        </button>
      </form>

      {/* Estado de carga */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Cargando usuarios…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className={styles.error} role="alert">
          No se pudieron cargar los usuarios. Comprueba tu conexión e intenta de nuevo.
        </div>
      )}

      {/* Tabla */}
      {!isLoading && !error && (
        <>
          {users.length === 0 ? (
            <p className={styles.empty}>No se encontraron usuarios.</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className={!u.is_active ? styles.rowInactive : ''}>
                      <td className={styles.idCell}>{u.id}</td>
                      <td className={styles.usernameCell}>{u.username}</td>
                      <td>{u.email}</td>
                      <td>
                        <span className={u.is_staff ? styles.badgeAdmin : styles.badgeUser}>
                          {u.is_staff ? 'Admin' : 'Comprador'}
                        </span>
                      </td>
                      <td>
                        <span className={u.is_active ? styles.badgeActive : styles.badgeSuspended}>
                          {u.is_active ? 'Activo' : 'Suspendido'}
                        </span>
                      </td>
                      <td className={styles.dateCell}>
                        {new Date(u.date_joined).toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                      <td>
                        <Link
                          to={`/admin/users/${u.id}`}
                          className={styles.linkBtn}
                          aria-label={`Ver perfil de ${u.username}`}
                        >
                          Ver
                        </Link>
                        <select
                          aria-label={`Cambiar rol de ${u.username}`}
                          value={u.is_staff ? 'admin' : 'buyer'}
                          onChange={(e) => handleRoleChange(u, e.target.value)}
                          disabled={adminUsersState.isActioning}
                        >
                          <option value="buyer">Comprador</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.count > 0 && (
            <p className={styles.pagination}>
              Mostrando {users.length} de {pagination.count} usuarios
            </p>
          )}
        </>
      )}

      {/* Modal crear admin */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => { setShowCreateModal(false); dispatch(clearActionState()); }}
          onCreated={handleCreated}
        />
      )}
    </main>
  );
}
