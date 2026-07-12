/**
 * AdminUserPermissions — UC-ADM-02 (party/authz, T-201)
 *
 * Panel para que un superadministrador edite los **roles authz** de un
 * usuario. Party/authz (DEC-01=B): los ``is_staff``/``is_superuser``/
 * ``groups`` nativos ya no existen — el acceso admin es la titularidad del
 * rol ``superadmin`` (u otros roles) vía ``RoleAssignment``. Envía
 * ``{ roles: [ids] }`` a POST /api/v2/admin/users/:pk/permissions/ (thunk
 * `updateUserPermissions`); ``roles`` reemplaza el conjunto actual.
 *
 * Maneja:
 *   - éxito (refleja el detalle devuelto por la API en el store);
 *   - error de negocio con clave `codigo_error` (en particular
 *     CANNOT_DEMOTE_SELF: un admin no puede quitarse a sí mismo el rol
 *     superadmin, evitando el auto-lockout del panel);
 *   - 403 (sin la capacidad `permissions.manage`).
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserPermissions, clearActionState } from '@redux/slices/adminSlice';
import { Button } from '@components/common/primitives';
import styles from './AdminUserPermissions.module.scss';

/** Convierte "1, 2, 3" en [1,2,3], descartando entradas no numéricas. */
function parseRoleIds(raw) {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number(s))
    .filter((n) => Number.isInteger(n) && n > 0);
}

/** Ids de rol actuales del usuario (el detalle expone `roles: [{id,code,name}]`). */
function currentRoleIds(user) {
  return (user?.roles || []).map((r) => (typeof r === 'object' ? r.id : r));
}

export default function AdminUserPermissions({ user }) {
  const dispatch = useDispatch();
  const isActioning = useSelector((s) => s.admin?.isActioning);
  const actionError = useSelector((s) => s.admin?.actionError);
  const lastAction  = useSelector((s) => s.admin?.lastAction);
  const authUser    = useSelector((s) => s.auth?.user);

  const [rolesRaw, setRolesRaw] = useState(currentRoleIds(user).join(', '));

  // Reseteo del control cuando cambia el usuario mostrado.
  useEffect(() => {
    setRolesRaw(currentRoleIds(user).join(', '));
  }, [user?.id, user?.roles]);

  // Limpiar estado de acción al desmontar para no arrastrar mensajes.
  useEffect(() => () => { dispatch(clearActionState()); }, [dispatch]);

  const isSelf = authUser?.id != null && user?.id != null && authUser.id === user.id;

  const success = lastAction === 'permissions_updated' && !actionError;
  const selfLockout = actionError?.codigo_error === 'CANNOT_DEMOTE_SELF';
  const forbidden = actionError?.statusCode === 403;

  const errorMessage = useMemo(() => {
    if (!actionError) return null;
    if (selfLockout) {
      return 'No puedes quitarte a ti mismo el rol de superadministrador: '
           + 'perderías el acceso al panel de administración.';
    }
    if (forbidden) {
      return 'No tienes permiso para gestionar los roles de este usuario.';
    }
    return actionError.message || 'No se pudieron actualizar los roles.';
  }, [actionError, selfLockout, forbidden]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUserPermissions({
      pk: user.id,
      changes: { roles: parseRoleIds(rolesRaw) },
    }));
  };

  return (
    <section className={styles.panel} aria-labelledby="perm-title">
      <header className={styles.header}>
        <h2 id="perm-title" className={styles.title}>Roles</h2>
        <p className={styles.subtitle}>
          Controla el acceso de {user.email} al panel mediante sus roles authz.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Roles (ids separados por coma)</span>
          <input
            type="text"
            inputMode="numeric"
            className={styles.fieldInput}
            placeholder="p. ej. 1, 2, 3"
            value={rolesRaw}
            disabled={isActioning}
            onChange={(ev) => setRolesRaw(ev.target.value)}
          />
          <span className={styles.fieldHint}>
            Reemplaza el conjunto actual de roles del usuario. El rol
            superadmin otorga acceso total al panel.
          </span>
        </label>

        {isSelf && (
          <p className={styles.selfNote} role="note">
            Estás editando tu propia cuenta: no podrás quitarte el rol de
            superadministrador.
          </p>
        )}

        {errorMessage && (
          <p className={styles.error} role="alert">{errorMessage}</p>
        )}
        {success && (
          <p className={styles.success} role="status">Roles actualizados.</p>
        )}

        <Button type="submit" variant="primary" disabled={isActioning}>
          {isActioning ? 'Guardando…' : 'Guardar roles'}
        </Button>
      </form>
    </section>
  );
}
