/**
 * StatusTimeline — UC-ADM-04
 *
 * Línea de tiempo vertical del historial de transiciones de estado (orden).
 * Reemplaza la lista `<ol>` plana por una visualización con hitos (punto +
 * conector) que se lee de un vistazo. Presentacional y reutilizable para
 * cualquier log de estados (previous_status → new_status + autor + fecha).
 */
import styles from './StatusTimeline.module.scss';

export default function StatusTimeline({ logs = [], formatDate = (d) => d }) {
  if (!logs || logs.length === 0) return null;
  // Más reciente primero.
  const ordered = [...logs].reverse();
  return (
    <ol className={styles.timeline}>
      {ordered.map((log, i) => (
        <li key={log.id ?? i} className={`${styles.entry} ${i === 0 ? styles.latest : ''}`}>
          <span className={styles.dot} aria-hidden="true" />
          <div className={styles.body}>
            <span className={styles.transition}>
              {log.previous_status} <span aria-hidden="true">&rarr;</span> {log.new_status}
            </span>
            {log.notes && <span className={styles.notes}> — {log.notes}</span>}
            <div className={styles.meta}>
              {log.changed_by_username ?? 'Sistema'} · {formatDate(log.created_at)}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
