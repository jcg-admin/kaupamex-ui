/**
 * AdminUserPermissions — UC-ADM-02
 *
 * Panel para que un superadministrador edite los permisos de un usuario:
 * is_staff, is_superuser y groups (ids). Hace POST a
 * /api/v1/admin/users/:pk/permissions/ vía el thunk `updateUserPermissions`.
 *
 * Maneja:
 *   - éxito (refleja el detalle devuelto por la API en el store);
 *   - error de negocio con clave `codigo_error` (en particular
 *     CANNOT_DEMOTE_SELF, que impide el auto-lockout del panel admin);
 *   - 403 (sin permiso para gestionar permisos).
 *
 * El control de superusuario se muestra solo a un superadmin
 * (state.auth.user.is_admin), siguiendo el contrato del backend donde solo
 * un superusuario puede otorgar/revocar is_superuser.
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserPermissions, clearActionState } from '@redux/slices/adminSlice';
import { Button } from '@components/common/primitives';
import styles from './AdminUserPermissions.module.scss';

/** Convierte "1, 2, 3" en [1,2,3], descartando entradas no numéricas. */
function parseGroups(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);
}

export default function AdminUserPermissions({ user }) {
  const dispatch = useDispatch();
  const isActioning = useSelector((s) => s.admin?.isActioning);
  const actionError = useSelector((s) => s.admin?.actionError);
  const lastAction  = useSelector((s) => s.admin?.lastAction);
  const authUser    = useSelector((s) => s.auth?.user);

  // is_admin es el alias de lectura de is_superuser en el serializer del API.
  const [isStaff, setIsStaff]           = useState(Boolean(user?.is_staff));
  const [isSuperuser, setIsSuperuser]   = useState(Boolean(user?.is_admin));
  const [groupsRaw, setGroupsRaw]       = useState(
    (user?.groups || []).map((g) => (typeof g === 'object' ? g.id : g)).join(', ')
  );

  // Reseteo de los controles cuando cambia el usuario mostrado.
  useEffect(() => {
    setIsStaff(Boolean(user?.is_staff));
    setIsSuperuser(Boolean(user?.is_admin));
    setGroupsRaw(
      (user?.groups || []).map((g) => (typeof g === 'object' ? g.id : g)).join(', ')
    );
  }, [user?.id, user?.is_staff, user?.is_admin, user?.groups]);

  // Limpiar estado de acción al desmontar para no arrastrar mensajes.
  useEffect(() => () => { dispatch(clearActionState()); }, [dispatch]);

  const viewerIsSuperuser = Boolean(authUser?.is_admin);
  const isSelf = authUser?.id != null && user?.id != null && authUser.id === user.id;

  const success = lastAction === 'permissions_updated' && !actionError;
  const selfLockout = actionError?.codigo_error === 'CANNOT_DEMOTE_SELF';
  const forbidden = actionError?.statusCode === 403;

  const errorMessage = useMemo(() => {
    if (!actionError) return null;
    if (selfLockout) {
      return 'No puedes quitarte a ti mismo el acceso de staff o superusuario: '
           + 'perderías el acceso al panel de administración.';
    }
    if (forbidden) {
      return 'No tienes permiso para gestionar los permisos de este usuario.';
    }
    return actionError.message || 'No se pudieron actualizar los permisos.';
  }, [actionError, selfLockout, forbidden]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const changes = {
      is_staff: isStaff,
      groups:   parseGroups(groupsRaw),
    };
    // Solo un superadmin puede modificar is_superuser.
    if (viewerIsSuperuser) changes.is_superuser = isSuperuser;
    dispatch(updateUserPermissions({ pk: user.id, changes }));
  };

  return (
    <section className={styles.panel} aria-labelledby="perm-title">
      <header className={styles.header}>
        <h2 id="perm-title" className={styles.title}>Permisos</h2>
        <p className={styles.subtitle}>
          Controla el acceso de @{user.username} al panel y sus grupos.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={isStaff}
            disabled={isActioning}
            onChange={(ev) => setIsStaff(ev.target.checked)}
          />
          <span>
            <strong>Acceso de staff</strong>
            <em>Puede entrar al panel de administración.</em>
          </span>
        </label>

        {viewerIsSuperuser && (
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={isSuperuser}
              disabled={isActioning}
              onChange={(ev) => setIsSuperuser(ev.target.checked)}
            />
            <span>
              <strong>Superusuario</strong>
              <em>Acceso total, incluida la gestión de permisos.</em>
            </span>
          </label>
        )}

        <label className={styles.field}>
          <span className={styles.fieldLabel}>Grupos (ids separados por coma)</span>
          <input
            type="text"
            inputMode="numeric"
            className={styles.fieldInput}
            placeholder="p. ej. 1, 2, 3"
            value={groupsRaw}
            disabled={isActioning}
            onChange={(ev) => setGroupsRaw(ev.target.value)}
          />
          <span className={styles.fieldHint}>
            Reemplaza el conjunto actual de grupos del usuario.
          </span>
        </label>

        {isSelf && (
          <p className={styles.selfNote} role="note">
            Estás editando tu propia cuenta: no podrás quitarte el acceso de
            staff ni de superusuario.
          </p>
        )}

        {errorMessage && (
          <p className={styles.error} role="alert">{errorMessage}</p>
        )}
        {success && (
          <p className={styles.success} role="status">Permisos actualizados.</p>
        )}

        <Button type="submit" variant="primary" disabled={isActioning}>
          {isActioning ? 'Guardando…' : 'Guardar permisos'}
        </Button>
      </form>
    </section>
  );
}
