/**
 * AdminReturnsPage — PracticaYoruba
 * UC-RET-05: Bandeja de devoluciones pendientes (Admin)
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminReturns } from '@hooks/domain/useReturns';
import {
  RETURN_STATUS_LABEL,
  REASON_LABEL,
} from '@pages/account/returnStatus';
import styles from './AdminReturnsPage.module.scss';

const STATUS_OPTIONS = [
  { value: '',                       label: 'Estados activos' },
  { value: 'PENDIENTE_REVISION',     label: 'Pendiente de revisión' },
  { value: 'APROBADA',               label: 'Aprobada' },
  { value: 'PENDIENTE_INFORMACION',  label: 'Pendiente de información' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminReturnsPage() {
  const [filters, setFilters] = useState({ status: '' });
  const params = filters.status ? { status: filters.status } : {};
  const { data, isLoading, isError } = useAdminReturns(params);
  const items   = data?.results ?? (Array.isArray(data) ? data : []);
  const metrics = data?.metrics ?? null;

  const summary = useMemo(() => ({
    pendientes:     metrics?.pendientes     ?? 0,
    aprobadas:      metrics?.aprobadas      ?? 0,
    pendiente_info: metrics?.pendiente_info ?? 0,
  }), [metrics]);

  const handleStatusChange = (event) => {
    setFilters((prev) => ({ ...prev, status: event.target.value }));
  };

  return (
    <section className={styles.page} aria-labelledby="admin-returns-title">
      <header className={styles.header}>
        <h1 id="admin-returns-title" className={styles.title}>
          Devoluciones pendientes
        </h1>
      </header>

      <div className={styles.metrics} aria-label="Conteo por estado">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Pendientes de revisión</span>
          <span className={styles.metricValue}>{summary.pendientes}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Aprobadas</span>
          <span className={styles.metricValue}>{summary.aprobadas}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Pendiente de información</span>
          <span className={styles.metricValue}>{summary.pendiente_info}</span>
        </div>
      </div>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Estado</span>
          <select value={filters.status} onChange={handleStatusChange}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Cargando bandeja…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la bandeja de devoluciones. Intenta de nuevo.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No hay devoluciones pendientes de atención.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Orden</th>
              <th>Comprador</th>
              <th>Motivo</th>
              <th>Estado</th>
              <th>Solicitada</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ret) => (
              <tr key={ret.id}>
                <td>#{ret.id}</td>
                <td>{ret.order_id}</td>
                <td>
                  <div className={styles.customer}>
                    <span>{ret.customer?.name ?? '—'}</span>
                    <span className={styles.customerEmail}>
                      {ret.customer?.email ?? '—'}
                    </span>
                  </div>
                </td>
                <td>{REASON_LABEL[ret.reason] ?? ret.reason}</td>
                <td>{RETURN_STATUS_LABEL[ret.status] ?? ret.status}</td>
                <td>{formatDate(ret.created_at)}</td>
                <td>
                  <Link
                    to={`/admin/returns/${ret.id}`}
                    className={styles.detailLink}
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
