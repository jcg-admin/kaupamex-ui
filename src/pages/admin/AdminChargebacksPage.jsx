/**
 * AdminChargebacksPage — Kaupamex
 * T-17-B: lista de contracargos recibidos via webhook de MercadoPago.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminChargebacks } from '@hooks/domain/usePayments';
import DataTable from '@components/common/DataTable/DataTable';
import styles from './AdminChargebacksPage.module.scss';

const STATUS_OPTIONS = [
  { value: '',          label: 'Todos' },
  { value: 'pending',   label: 'Pendiente' },
  { value: 'lost',      label: 'Perdido' },
  { value: 'won',       label: 'Ganado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'closed',    label: 'Cerrado' },
];

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('es-MX');
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

export default function AdminChargebacksPage() {
  const [status, setStatus] = useState('');
  const params = status ? { status } : {};
  const { data: chargebacks = [], isLoading, isError } = useAdminChargebacks(params);

  const columns = useMemo(() => [
    {
      key: 'gateway_chargeback_id',
      header: 'ID Gateway',
      sortable: true,
      render: (cb) => <span className={styles.mono}>{cb.gateway_chargeback_id}</span>,
    },
    {
      key: 'gateway_payment_id',
      header: 'Pago MP',
      sortable: true,
      render: (cb) => <span className={styles.mono}>{cb.gateway_payment_id}</span>,
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      align: 'right',
      value: (cb) => Number(cb.amount ?? 0),
      render: (cb) => formatCurrency(cb.amount),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (cb) => (
        <span className={`${styles.badge} ${styles[`badge_${cb.status}`] || ''}`.trim()}>
          {cb.status}
        </span>
      ),
    },
    {
      key: 'reason_code',
      header: 'Razon',
      sortable: true,
      render: (cb) => cb.reason_code || '—',
    },
    {
      key: 'created_at',
      header: 'Fecha',
      sortable: true,
      value: (cb) => (cb.created_at ? new Date(cb.created_at) : null),
      render: (cb) => formatDate(cb.created_at),
    },
    {
      key: 'detail',
      header: 'Detalle',
      filterable: false,
      render: (cb) => (
        <Link to={`/admin/chargebacks/${cb.id}`} className={styles.link}>
          Ver
        </Link>
      ),
    },
  ], []);

  return (
    <section className={styles.page} aria-labelledby="chargebacks-title">
      <header className={styles.header}>
        <h1 id="chargebacks-title" className={styles.title}>Contracargos</h1>
      </header>

      <div className={styles.filters}>
        <label className={styles.filter}>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      {isError && <p role="alert" className={styles.error}>Error al cargar contracargos.</p>}

      {!isError && (
        <DataTable
          columns={columns}
          rows={chargebacks}
          rowKey={(cb) => cb.id}
          filterable
          pageSize={20}
          loading={isLoading}
          loadingText="Cargando contracargos…"
          emptyText="No hay contracargos registrados."
          caption="Contracargos recibidos"
        />
      )}
    </section>
  );
}
