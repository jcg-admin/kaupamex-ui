/**
 * AdminContactMessagesPage — Kaupamex
 * UC-COM-02: bandeja admin de mensajes de contacto recibidos.
 *
 * H-CICLO123-01: la API pagina a 25 mensajes/página (PageNumberPagination).
 * Sin controles de paginación el admin solo podía ver los primeros 25
 * mensajes. Se añaden botones Anterior/Siguiente leyendo data.next /
 * data.previous y el parámetro ?page= en los filtros.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminContactMessages } from '@hooks/domain/useContactMessages';
import { DataTable } from '@components/common';
import styles from './AdminContactMessagesPage.module.scss';

function getStatusLabel(m) {
  if (m.replied) return 'Respondido';
  if (m.read)    return 'Leido';
  return 'Sin leer';
}

const STATUS_OPTIONS = [
  { value: '',         label: 'Todos los estados' },
  { value: 'UNREAD',   label: 'Sin leer' },
  { value: 'READ',     label: 'Leido' },
  { value: 'REPLIED',  label: 'Respondido' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminContactMessagesPage() {
  const [filters, setFilters] = useState({ status: '', q: '' });
  const [page, setPage] = useState(1);
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.q)      params.q      = filters.q;
  if (page > 1)       params.page   = page;

  // Reset to page 1 whenever filters change
  const handleFilterChange = (updater) => {
    setFilters(updater);
    setPage(1);
  };

  const { data, isLoading, isError } = useAdminContactMessages(params);
  const items    = data?.results ?? data?.messages ?? (Array.isArray(data) ? data : []);
  const hasNext  = Boolean(data?.next);
  const hasPrev  = page > 1;

  return (
    <section className={styles.page} aria-labelledby="contact-inbox-title">
      <header className={styles.header}>
        <h1 id="contact-inbox-title" className={styles.title}>
          Bandeja de mensajes de contacto
        </h1>
      </header>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Estado</span>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange((p) => ({ ...p, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
        <label className={styles.filter}>
          <span>Buscar (asunto o email)</span>
          <input
            type="search"
            value={filters.q}
            onChange={(e) => handleFilterChange((p) => ({ ...p, q: e.target.value }))}
            placeholder="ana@example.com"
          />
        </label>
      </div>

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la bandeja. Intenta de nuevo.
        </p>
      )}

      <DataTable
        columns={[
          { key: 'id',         header: 'ID',
            render: (m) => `#${m.id}` },
          { key: 'subject',    header: 'Asunto',     sortable: true },
          { key: 'remitente',  header: 'Remitente',
            render: (m) => (
              <div className={styles.customer}>
                <span>{m.name ?? '—'}</span>
                <span className={styles.customerEmail}>{m.email ?? '—'}</span>
              </div>
            ) },
          { key: 'status',     header: 'Estado',
            render: (m) => getStatusLabel(m) },
          { key: 'created_at', header: 'Recibido',   sortable: true,
            render: (m) => formatDate(m.created_at) },
          { key: 'actions',    header: 'Acciones',
            render: (m) => (
              <Link
                to={`/admin/contact/messages/${m.id}`}
                className={styles.detailLink}
              >
                Ver detalle
              </Link>
            ) },
        ]}
        rows={items}
        rowKey={(m) => m.id}
        loading={isLoading}
        emptyText="No hay mensajes para mostrar."
        caption="Mensajes de contacto"
        pageSize={0}
      />

      {/* H-CICLO123-01: pagination controls */}
      {(hasPrev || hasNext) && (
        <nav className={styles.pagination} aria-label="Paginacion de mensajes">
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!hasPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </button>
          <span className={styles.pageInfo}>Página {page}</span>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={!hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </button>
        </nav>
      )}
    </section>
  );
}
