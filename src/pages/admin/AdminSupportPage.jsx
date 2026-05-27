/**
 * AdminSupportPage — PracticaYoruba
 * UC-SUPP-05: Bandeja y reporte de tickets para el equipo de soporte.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminSupportTickets } from '@hooks/domain/useSupportTickets';
import styles from './AdminSupportPage.module.scss';

const PAGE_SIZE = 20;

// T-112 D-02 (alinear-ui-support-internal-notes-enum): enum sync
// al modelo real apps/support/models.py:24-29. UI antes mapeaba
// {OPEN, REPLIED, CLOSED} = inventado; backend define 5 estados
// canon. Filtro UI por REPLIED retornaba [] vacio; estados reales
// (IN_PROGRESS, AWAITING_USER, RESOLVED) se mostraban como codigo
// crudo.
const STATUS_LABEL = {
  OPEN:           'Abierto',
  IN_PROGRESS:    'En atencion',
  AWAITING_USER:  'Esperando comprador',
  RESOLVED:       'Resuelto',
  CLOSED:         'Cerrado',
};

const STATUS_OPTIONS = [
  { value: '',               label: 'Todos los estados' },
  { value: 'OPEN',           label: 'Abierto' },
  { value: 'IN_PROGRESS',    label: 'En atencion' },
  { value: 'AWAITING_USER',  label: 'Esperando comprador' },
  { value: 'RESOLVED',       label: 'Resuelto' },
  { value: 'CLOSED',         label: 'Cerrado' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminSupportPage() {
  const [filters, setFilters] = useState({ status: '', q: '' });
  const [page, setLocalPage]  = useState(1);
  const params = { page };
  if (filters.status) params.status = filters.status;
  if (filters.q)      params.q      = filters.q;
  const { data, isLoading, isError } = useAdminSupportTickets(params);
  const items      = data?.results ?? (Array.isArray(data) ? data : []);
  const metrics    = data?.metrics ?? null;
  const totalCount = data?.count   ?? 0;
  const totalPages = totalCount ? Math.ceil(totalCount / PAGE_SIZE) : 0;

  const summary = useMemo(() => ({
    open:        metrics?.open          ?? 0,
    in_progress: (metrics?.in_progress ?? 0) + (metrics?.awaiting_user ?? 0),
    resolved:    metrics?.resolved      ?? 0,
    closed:      metrics?.closed        ?? 0,
    avg:         metrics?.avg_first_response_hours ?? null,
  }), [metrics]);

  const handleStatusChange = (event) => {
    setFilters((prev) => ({ ...prev, status: event.target.value }));
    setLocalPage(1);
  };

  const handleSearchChange = (event) => {
    setFilters((prev) => ({ ...prev, q: event.target.value }));
    setLocalPage(1);
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
          <span className={styles.metricLabel}>En proceso</span>
          <span className={styles.metricValue}>{summary.in_progress}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Resueltos</span>
          <span className={styles.metricValue}>{summary.resolved}</span>
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
              <tr key={ticket.ticket_id}>
                <td>#{ticket.ticket_id}</td>
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
                    to={`/support/tickets/${ticket.ticket_id}`}
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

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setLocalPage(page - 1)}>
            ← Anterior
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={p === page ? styles.pageActive : ''}
              onClick={() => setLocalPage(p)}
            >
              {p}
            </button>
          ))}
          <button disabled={page === totalPages} onClick={() => setLocalPage(page + 1)}>
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}
