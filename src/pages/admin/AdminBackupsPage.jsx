/**
 * AdminBackupsPage — UC-ADM-05
 *
 *   GET  /api/v2/admin/backups/
 *   POST /api/v2/admin/backups/trigger/
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
import { DataTable } from '@components/common/DataTable/DataTable';
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

  // Columnas DataTable (T-04): preserva las 5 columnas y el enlace de
  // descarga de la tabla cruda. Sort de cliente sobre la pagina actual.
  const columns = [
    {
      key: 'created_at',
      header: 'Fecha',
      sortable: true,
      value: (b) => new Date(b.created_at).getTime(),
      render: (b) => new Date(b.created_at).toLocaleString('es-MX'),
    },
    {
      key: 'type',
      header: 'Tipo',
      sortable: true,
      render: (b) => b.type ?? 'AUTO',
    },
    {
      key: 'size_bytes',
      header: 'Tamaño',
      sortable: true,
      value: (b) => b.size_bytes ?? 0,
      render: (b) => formatSize(b.size_bytes),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
    },
    {
      key: 'download',
      header: 'Descarga',
      filterable: false,
      render: (b) => (
        b.download_url
          ? <a href={b.download_url} target="_blank" rel="noopener noreferrer">Descargar</a>
          : '—'
      ),
    },
  ];

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

      {isError && <p role="alert">No se pudieron cargar los backups.</p>}

      <DataTable
        columns={columns}
        rows={backups}
        loading={isLoading}
        loadingText="Cargando backups…"
        emptyText="Sin backups registrados."
        pageSize={20}
        rowKey={(b) => b.id}
        caption="Historial de backups"
      />
    </section>
  );
}
