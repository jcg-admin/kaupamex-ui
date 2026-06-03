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
import { DataTable } from '@components/common/DataTable/DataTable';
import styles from './AdminReturnsPage.module.scss';

const STATUS_OPTIONS = [
  { value: '',                       label: 'Estados activos' },
  { value: 'PENDING_REVIEW',     label: 'Pendiente de revisión' },
  { value: 'APPROVED',               label: 'Aprobada' },
  { value: 'INFO_REQUESTED',  label: 'Pendiente de información' },
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

  const columns = useMemo(() => [
    { key: 'id', header: 'ID', sortable: true, render: (ret) => `#${ret.id}` },
    { key: 'order_id', header: 'Orden', sortable: true },
    {
      key: 'user_username',
      header: 'Comprador',
      sortable: true,
      // H-CICLO35-02: AdminReturnListSerializer expone user_username y user_email,
      // no un objeto customer. ret.customer siempre undefined → mostraba '—'.
      render: (ret) => (
        <div className={styles.customer}>
          <span>{ret.user_username ?? '—'}</span>
          <span className={styles.customerEmail}>{ret.user_email ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Motivo',
      sortable: true,
      value: (ret) => REASON_LABEL[ret.reason] ?? ret.reason,
      render: (ret) => REASON_LABEL[ret.reason] ?? ret.reason,
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      value: (ret) => RETURN_STATUS_LABEL[ret.status] ?? ret.status,
      render: (ret) => RETURN_STATUS_LABEL[ret.status] ?? ret.status,
    },
    {
      key: 'created_at',
      header: 'Solicitada',
      sortable: true,
      render: (ret) => formatDate(ret.created_at),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (ret) => (
        <Link to={`/admin/returns/${ret.id}`} className={styles.detailLink}>
          Ver detalle
        </Link>
      ),
    },
  ], []);

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
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(ret) => ret.id}
          caption="Devoluciones pendientes"
        />
      )}
    </section>
  );
}
