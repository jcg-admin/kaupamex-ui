/**
 * AdminContactMessagesPage — PracticaYoruba
 * UC-COM-02: bandeja admin de mensajes de contacto recibidos.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminContactMessages } from '@hooks/domain/useContactMessages';
import styles from './AdminContactMessagesPage.module.scss';

const STATUS_LABEL = {
  UNREAD:    'Sin leer',
  READ:      'Leido',
  REPLIED:   'Respondido',
};

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
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.q)      params.q      = filters.q;

  const { data, isLoading, isError } = useAdminContactMessages(params);
  const items = data?.results ?? data?.messages ?? (Array.isArray(data) ? data : []);

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
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
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
            onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
            placeholder="ana@example.com"
          />
        </label>
      </div>

      {isLoading && <p>Cargando bandeja…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar la bandeja. Intenta de nuevo.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No hay mensajes para mostrar.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Asunto</th>
              <th>Remitente</th>
              <th>Estado</th>
              <th>Recibido</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>#{m.id}</td>
                <td>{m.subject}</td>
                <td>
                  <div className={styles.customer}>
                    <span>{m.name ?? '—'}</span>
                    <span className={styles.customerEmail}>{m.email ?? '—'}</span>
                  </div>
                </td>
                <td>{STATUS_LABEL[m.status] ?? m.status}</td>
                <td>{formatDate(m.created_at)}</td>
                <td>
                  <Link
                    to={`/admin/contact/messages/${m.id}`}
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
