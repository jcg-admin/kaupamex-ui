/**
 * AdminPermissionsPage — UC-ADM-02
 *
 * Matriz de roles x permisos. El admin puede marcar/desmarcar
 * permisos de cada rol y guarda los cambios via PUT a
 * /api/v1/admin/roles/:role/permissions/.
 *
 *   GET  /api/v1/admin/permissions/
 *   PUT  /api/v1/admin/roles/:role/permissions/
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePermissions, PERMISSIONS_KEY,
} from '@hooks/domain/usePermissions';
import {
  updateRolePermissions, clearPermissionsActionState,
} from '@redux/slices/permissionsSlice';
import styles from './AdminPermissionsPage.module.scss';

export default function AdminPermissionsPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.permissions);
  const { data, isLoading, isError } = usePermissions();

  const roles = data?.roles ?? [];
  const permissions = data?.permissions ?? [];

  // Local cache of changes per role.
  const [matrix, setMatrix] = useState({});

  useEffect(() => {
    if (!roles.length) return;
    const next = {};
    roles.forEach((r) => {
      next[r.role] = new Set(r.permissions ?? []);
    });
    setMatrix(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const togglePermission = (role, perm) => {
    setMatrix((prev) => {
      const set = new Set(prev[role] ?? []);
      if (set.has(perm)) set.delete(perm); else set.add(perm);
      return { ...prev, [role]: set };
    });
  };

  const handleSave = async (role) => {
    const result = await dispatch(updateRolePermissions({
      role,
      permissions: Array.from(matrix[role] ?? []),
    }));
    if (updateRolePermissions.fulfilled.match(result)) {
      dispatch(clearPermissionsActionState());
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_KEY });
    }
  };

  if (isLoading) return <p>Cargando permisos…</p>;
  if (isError)   return <p role="alert">No se pudieron cargar los permisos.</p>;

  return (
    <section className={styles.page} aria-labelledby="permissions-title">
      <header className={styles.header}>
        <h1 id="permissions-title" className={styles.title}>
          Permisos
        </h1>
        <p className={styles.subtitle}>
          Matriz de roles y permisos. Marca o desmarca los permisos por rol.
        </p>
      </header>

      {actionError && (
        <p role="alert" className={styles.apiError}>
          {actionError.message ?? 'No se pudieron guardar los cambios.'}
        </p>
      )}
      {lastAction === 'updated' && (
        <p className={styles.success} role="status">
          Permisos actualizados correctamente.
        </p>
      )}

      <table className={styles.matrix}>
        <thead>
          <tr>
            <th>Permiso</th>
            {roles.map((r) => <th key={r.role}>{r.role}</th>)}
          </tr>
        </thead>
        <tbody>
          {permissions.map((perm) => (
            <tr key={perm}>
              <td>{perm}</td>
              {roles.map((r) => {
                const checked = matrix[r.role]?.has(perm) ?? false;
                return (
                  <td key={r.role}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermission(r.role, perm)}
                      aria-label={`${perm} para ${r.role}`}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td></td>
            {roles.map((r) => (
              <td key={r.role}>
                <button
                  type="button"
                  onClick={() => handleSave(r.role)}
                  disabled={isActioning}
                >
                  Guardar {r.role}
                </button>
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </section>
  );
}
