/**
 * AdminBackupsPage — UC-ADM-05
 *
 *   GET  /api/v1/admin/backups/
 *   POST /api/v1/admin/backups/trigger/
 *
 * UC-ADM-05 es un cron — esta pagina permite ver el historial y
 * disparar un backup manual on-demand.
 */
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useBackups, BACKUPS_KEY } from '@hooks/domain/useBackups';
import {
  triggerBackup, clearBackupsActionState,
} from '@redux/slices/backupsSlice';
import styles from './AdminBackupsPage.module.scss';

function formatSize(bytes) {
  if (!bytes) return '—';
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export default function AdminBackupsPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.backups);
  const { data, isLoading, isError } = useBackups();
  const backups = data?.results ?? [];

  const handleTrigger = async () => {
    const result = await dispatch(triggerBackup());
    if (triggerBackup.fulfilled.match(result)) {
      dispatch(clearBackupsActionState());
      queryClient.invalidateQueries({ queryKey: BACKUPS_KEY });
    }
  };

  return (
    <section className={styles.page} aria-labelledby="backups-title">
      <header className={styles.header}>
        <h1 id="backups-title" className={styles.title}>Backups</h1>
        <p className={styles.subtitle}>
          Historial de backups automaticos y disparo manual on-demand.
        </p>
        <button
          type="button"
          onClick={handleTrigger}
          disabled={isActioning}
          className={styles.triggerBtn}
        >
          {isActioning ? 'Generando…' : 'Generar backup ahora'}
        </button>
      </header>

      {actionError && (
        <p role="alert" className={styles.apiError}>
          {actionError.message ?? 'No se pudo generar el backup.'}
        </p>
      )}
      {lastAction === 'triggered' && (
        <p role="status" className={styles.success}>
          Backup encolado correctamente.
        </p>
      )}

      {isLoading && <p>Cargando backups…</p>}
      {isError && <p role="alert">No se pudieron cargar los backups.</p>}

      {!isLoading && backups.length === 0 && !isError && (
        <p>Sin backups registrados.</p>
      )}

      {backups.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Tamaño</th>
              <th>Estado</th>
              <th>Descarga</th>
            </tr>
          </thead>
          <tbody>
            {backups.map((b) => (
              <tr key={b.id}>
                <td>{new Date(b.created_at).toLocaleString('es-MX')}</td>
                <td>{b.type ?? 'AUTO'}</td>
                <td>{formatSize(b.size_bytes)}</td>
                <td>{b.status}</td>
                <td>
                  {b.download_url
                    ? <a href={b.download_url} target="_blank" rel="noreferrer">Descargar</a>
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
