/**
 * AdminNewsletterSubscribersPage — Kaupamex
 * UC-NEW-03: el admin lista y desuscribe manualmente suscriptores.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  adminUnsubscribeSubscriber,
  clearNewsletterActionState,
} from '@redux/slices/newsletterSlice';
import { useNewsletterSubscribers } from '@hooks/domain/useNewsletter';
import { DataTable } from '@components/common/DataTable/DataTable';
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
  // DRF PageNumberPagination returns `count`, not `total`.
  const total = data?.count ?? items.length;

  const handleUnsubscribe = (id, email) => {
    if (!window.confirm(`¿Desuscribir a ${email}? Esta acción no se puede deshacer.`)) return;
    dispatch(clearNewsletterActionState());
    dispatch(adminUnsubscribeSubscriber({ id, reason: 'SOLICITUD_MANUAL' }));
  };

  // Columnas para DataTable (sort + filtro de cliente sobre la página actual).
  const columns = [
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      value: (s) => STATUS_LABEL[s.status] ?? s.status,
      render: (s) => STATUS_LABEL[s.status] ?? s.status,
    },
    {
      key: 'created_at',
      header: 'Suscripcion',
      sortable: true,
      render: (s) => formatDate(s.created_at),
    },
    {
      key: 'actions',
      header: 'Acciones',
      filterable: false,
      render: (s) => (
        s.status === 'ACTIVE' ? (
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => handleUnsubscribe(s.id, s.email)}
            disabled={isActioning}
          >
            Desuscribir
          </button>
        ) : null
      ),
    },
  ];

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

      <DataTable
        columns={columns}
        rows={items}
        loading={isLoading}
        loadingText="Cargando suscriptores…"
        emptyText="No hay suscriptores para mostrar."
        pageSize={20}
        filterable
        rowKey={(s) => s.id}
      />
    </section>
  );
}
