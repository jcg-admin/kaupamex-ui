/**
 * AdminAuditLogPage — UC-ADM-03
 *
 * Visor paginado de auditoria. Soporta filtros por accion y rango
 * temporal. Lectura via React Query.
 *
 *   GET /api/v1/admin/audit-log/?action=&actor_id=&from=&to=&page=
 */
import { useState } from 'react';
import { useAuditLog } from '@hooks/domain/useAuditLog';
import styles from './AdminAuditLogPage.module.scss';

export default function AdminAuditLogPage() {
  const [page, setPage]     = useState(1);
  const [action, setAction] = useState('');
  const [actor, setActor]   = useState('');
  const [from, setFrom]     = useState('');
  const [to, setTo]         = useState('');

  const params = { page };
  if (action) params.action     = action;
  if (actor)  params.actor_id   = actor;
  if (from)   params.from       = from;
  if (to)     params.to         = to;

  const { data, isLoading, isError } = useAuditLog(params);
  const entries = data?.results ?? [];
  const count   = data?.count ?? 0;
  const hasNext = Boolean(data?.next);

  const submit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <section className={styles.page} aria-labelledby="audit-title">
      <header className={styles.header}>
        <h1 id="audit-title" className={styles.title}>Auditoria</h1>
        <p className={styles.subtitle}>
          Registro estructurado de acciones administrativas (RNF-AUDIT-001).
        </p>
      </header>

      <form className={styles.filters} onSubmit={submit} role="search">
        <label>
          Accion
          <input
            type="text"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="ej. product.created"
          />
        </label>
        <label>
          Actor ID
          <input
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
          />
        </label>
        <label>
          Desde
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          Hasta
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
        <button type="submit">Filtrar</button>
      </form>

      {isLoading && <p>Cargando auditoria…</p>}
      {isError && <p role="alert">No se pudo cargar el log.</p>}

      {!isLoading && entries.length === 0 && !isError && (
        <p>No hay entradas para los filtros aplicados.</p>
      )}

      {entries.length > 0 && (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Actor</th>
                <th>Accion</th>
                <th>Recurso</th>
                <th>Correlation ID</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{new Date(e.timestamp).toLocaleString('es-MX')}</td>
                  <td>{e.actor_email ?? e.actor_id ?? '—'}</td>
                  <td>{e.action}</td>
                  <td>
                    {e.resource_type ? `${e.resource_type}#${e.resource_id}` : '—'}
                  </td>
                  <td className={styles.correlationCell}>{e.correlation_id}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination}>
            <span>{count} entradas · Pagina {page}</span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasNext}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </section>
  );
}
