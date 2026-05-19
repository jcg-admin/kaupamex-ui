/**
 * AdminUserDetailPage — PracticaYoruba
 * UC-AUTH-12: Ver perfil de usuario (Admin)
 * UC-AUTH-13: Suspender cuenta
 * UC-AUTH-14: Reactivar cuenta
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAdminUser, suspendUser, reactivateUser,
  clearCurrentUser, clearActionState,
} from '@redux/slices/adminSlice';
import styles from './AdminUserDetailPage.module.scss';

// =============================================================================
// Modal de confirmación reutilizable
// =============================================================================

function ConfirmModal({ title, message, onConfirm, onCancel, isLoading }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={styles.modalOverlay}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={styles.modal}>
        <h2 className={styles.modalTitle}>{title}</h2>
        <p className={styles.modalMessage}>{message}</p>
        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.btnSecondary}
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.btnDanger}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Procesando…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Página principal
// =============================================================================

export default function AdminUserDetailPage() {
  const { pk }   = useParams();
  const dispatch = useDispatch();

  const { currentUser: user, isLoadingUser, userError, isActioning, actionError } =
    useSelector((s) => s.admin);

  const [confirmAction, setConfirmAction] = useState(null); // 'suspend' | 'reactivate' | null

  useEffect(() => {
    dispatch(fetchAdminUser(pk));
    return () => {
      dispatch(clearCurrentUser());
      dispatch(clearActionState());
    };
  }, [dispatch, pk]);

  const handleConfirm = async () => {
    if (confirmAction === 'suspend') {
      const result = await dispatch(suspendUser(pk));
      if (suspendUser.fulfilled.match(result)) setConfirmAction(null);
    } else if (confirmAction === 'reactivate') {
      const result = await dispatch(reactivateUser(pk));
      if (reactivateUser.fulfilled.match(result)) setConfirmAction(null);
    }
  };

  // --- Estados de carga / error ---

  if (isLoadingUser) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Cargando perfil…</p>
      </div>
    );
  }

  if (userError || (!isLoadingUser && !user)) {
    return (
      <div className={styles.notFound}>
        <h1>Usuario no encontrado</h1>
        <p>El usuario solicitado no existe o no tienes acceso.</p>
        <Link to="/admin/users" className={styles.btnSecondary}>
          Volver al listado
        </Link>
      </div>
    );
  }

  if (!user) return null;

  const isActive = user.is_active;

  return (
    <main className={styles.page}>
      {/* Navegación */}
      <nav className={styles.breadcrumb} aria-label="Navegación">
        <Link to="/admin/users" className={styles.backLink}>
          Volver al listado de usuarios
        </Link>
      </nav>

      {/* Cabecera */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{user.username}</h1>
          <p className={styles.subtitle}>ID #{user.id}</p>
        </div>

        <div className={styles.actions}>
          {isActive ? (
            <button
              type="button"
              className={styles.btnDanger}
              onClick={() => setConfirmAction('suspend')}
              disabled={isActioning}
            >
              Suspender
            </button>
          ) : (
            <button
              type="button"
              className={styles.btnSuccess}
              onClick={() => setConfirmAction('reactivate')}
              disabled={isActioning}
            >
              Reactivar
            </button>
          )}
        </div>
      </header>

      {/* Error de acción */}
      {actionError && (
        <div className={styles.actionError} role="alert">{actionError}</div>
      )}

      {/* Perfil */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Información de la cuenta</h2>

        <dl className={styles.details}>
          <div className={styles.detailRow}>
            <dt>Estado</dt>
            <dd>
              <span className={isActive ? styles.badgeActive : styles.badgeSuspended}>
                {isActive ? 'Activo' : 'Suspendido'}
              </span>
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Tipo</dt>
            <dd>
              <span className={user.is_staff ? styles.badgeAdmin : styles.badgeUser}>
                {user.is_staff ? 'Administrador' : 'Comprador'}
              </span>
            </dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Usuario</dt>
            <dd>{user.username}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          {(user.first_name || user.last_name) && (
            <div className={styles.detailRow}>
              <dt>Nombre completo</dt>
              <dd>{[user.first_name, user.last_name].filter(Boolean).join(' ')}</dd>
            </div>
          )}
          {user.phone && (
            <div className={styles.detailRow}>
              <dt>Teléfono</dt>
              <dd>{user.phone}</dd>
            </div>
          )}
          <div className={styles.detailRow}>
            <dt>Fecha de registro</dt>
            <dd>
              {new Date(user.date_joined).toLocaleDateString('es-MX', {
                day: '2-digit', month: 'long', year: 'numeric',
              })}
            </dd>
          </div>
        </dl>
      </div>

      {/* Modal de confirmación */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction === 'suspend' ? 'Suspender cuenta' : 'Reactivar cuenta'}
          message={
            confirmAction === 'suspend'
              ? `¿Confirmas que deseas suspender la cuenta de "${user.username}"? El usuario perderá acceso inmediatamente.`
              : `¿Confirmas que deseas reactivar la cuenta de "${user.username}"?`
          }
          onConfirm={handleConfirm}
          onCancel={() => setConfirmAction(null)}
          isLoading={isActioning}
        />
      )}
    </main>
  );
}
