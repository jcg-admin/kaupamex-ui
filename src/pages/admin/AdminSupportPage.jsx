/**
 * AdminSupportPage — PracticaYoruba
 * UC-SUPP-05: Bandeja y reporte de tickets para el equipo de soporte.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminSupportTickets } from '@hooks/domain/useSupportTickets';
import styles from './AdminSupportPage.module.scss';

const STATUS_LABEL = {
  OPEN:    'Abierto',
  REPLIED: 'Respondido',
  CLOSED:  'Cerrado',
};

const STATUS_OPTIONS = [
  { value: '',        label: 'Todos los estados' },
  { value: 'OPEN',    label: 'Abierto' },
  { value: 'REPLIED', label: 'Respondido' },
  { value: 'CLOSED',  label: 'Cerrado' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminSupportPage() {
  const [filters, setFilters] = useState({ status: '', q: '' });
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.q)      params.q      = filters.q;
  const { data, isLoading, isError } = useAdminSupportTickets(params);
  const items   = data?.results ?? (Array.isArray(data) ? data : []);
  const metrics = data?.metrics ?? null;

  const summary = useMemo(() => ({
    open:     metrics?.open     ?? 0,
    replied:  metrics?.replied  ?? 0,
    closed:   metrics?.closed   ?? 0,
    avg:      metrics?.avg_first_response_hours ?? null,
  }), [metrics]);

  const handleStatusChange = (event) => {
    setFilters((prev) => ({ ...prev, status: event.target.value }));
  };

  const handleSearchChange = (event) => {
    setFilters((prev) => ({ ...prev, q: event.target.value }));
  };

  return (
    <section className={styles.page} aria-labelledby="admin-support-title">
      <header className={styles.header}>
        <h1 id="admin-support-title" className={styles.title}>
          Bandeja de soporte
        </h1>
      </header>

      <div className={styles.metrics} aria-label="Métricas del periodo">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Abiertos</span>
          <span className={styles.metricValue}>{summary.open}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Respondidos</span>
          <span className={styles.metricValue}>{summary.replied}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Cerrados</span>
          <span className={styles.metricValue}>{summary.closed}</span>
        </div>
        {summary.avg !== null && (
          <div className={styles.metric}>
            <span className={styles.metricLabel}>Tiempo medio 1ª resp.</span>
            <span className={styles.metricValue}>{summary.avg} h</span>
          </div>
        )}
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
        <label className={styles.filter}>
          <span>Comprador (email o nombre)</span>
          <input
            type="search"
            value={filters.q}
            onChange={handleSearchChange}
            placeholder="comprador@ejemplo.com"
          />
        </label>
      </div>

      {isLoading && <p>Cargando bandeja…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la bandeja de soporte. Intenta de nuevo.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No se encontraron tickets.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Asunto</th>
              <th>Comprador</th>
              <th>Estado</th>
              <th>Apertura</th>
              <th>Respuestas</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((ticket) => (
              <tr key={ticket.id}>
                <td>#{ticket.id}</td>
                <td>{ticket.subject}</td>
                <td>
                  <div className={styles.customer}>
                    <span>{ticket.customer?.name ?? '—'}</span>
                    <span className={styles.customerEmail}>
                      {ticket.customer?.email ?? '—'}
                    </span>
                  </div>
                </td>
                <td>{STATUS_LABEL[ticket.status] ?? ticket.status}</td>
                <td>{formatDate(ticket.created_at)}</td>
                <td>{ticket.replies_count ?? 0}</td>
                <td>
                  <Link
                    to={`/support/tickets/${ticket.id}`}
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
