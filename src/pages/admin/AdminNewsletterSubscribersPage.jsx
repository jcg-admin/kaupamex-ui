/**
 * AdminNewsletterSubscribersPage — PracticaYoruba
 * UC-NEW-03: el admin lista y desuscribe manualmente suscriptores.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  adminUnsubscribeSubscriber,
  clearNewsletterActionState,
} from '@redux/slices/newsletterSlice';
import { useNewsletterSubscribers } from '@hooks/domain/useNewsletter';
import styles from './AdminNewsletterSubscribersPage.module.scss';

const STATUS_LABEL = {
  ACTIVE:        'Activo',
  PENDING:       'Pendiente confirmacion',
  UNSUBSCRIBED:  'Desuscrito',
};

const STATUS_OPTIONS = [
  { value: '',             label: 'Todos los estados' },
  { value: 'ACTIVE',       label: 'Activos' },
  { value: 'PENDING',      label: 'Pendientes' },
  { value: 'UNSUBSCRIBED', label: 'Desuscritos' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminNewsletterSubscribersPage() {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.newsletter);
  const [filters, setFilters] = useState({ status: '' });

  const params = {};
  if (filters.status) params.status = filters.status;

  const { data, isLoading, isError } = useNewsletterSubscribers(params);
  const items = data?.results ?? (Array.isArray(data) ? data : []);
  const total = data?.total ?? items.length;

  const handleUnsubscribe = (id) => {
    dispatch(clearNewsletterActionState());
    dispatch(adminUnsubscribeSubscriber({ id, reason: 'SOLICITUD_MANUAL' }));
  };

  return (
    <section className={styles.page} aria-labelledby="subscribers-title">
      <header className={styles.header}>
        <h1 id="subscribers-title" className={styles.title}>
          Suscriptores del newsletter
        </h1>
        <p className={styles.summary}>
          {total} suscriptor(es) en el filtro actual.
        </p>
      </header>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Estado</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Cargando suscriptores…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar los suscriptores.
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message || 'No se pudo procesar la accion.'}
        </p>
      )}

      {lastAction === 'admin_unsubscribed' && (
        <p role="status" className={styles.success}>
          Suscriptor desuscrito manualmente.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No hay suscriptores para mostrar.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Email</th>
              <th>Estado</th>
              <th>Suscripcion</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id}>
                <td>{s.email}</td>
                <td>{STATUS_LABEL[s.status] ?? s.status}</td>
                <td>{formatDate(s.subscribed_at)}</td>
                <td>
                  {s.status === 'ACTIVE' && (
                    <button
                      type="button"
                      className={styles.secondaryBtn}
                      onClick={() => handleUnsubscribe(s.id)}
                      disabled={isActioning}
                    >
                      Desuscribir
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
