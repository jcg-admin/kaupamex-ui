/**
 * AdminPaymentsPage — PracticaYoruba
 * UC-PAY-11: Reporte/listado de transacciones de pago para el admin
 * con filtros por estado, gateway y rango de fechas + totales del periodo.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminPayments } from '@hooks/domain/usePayments';
import { DateRangePicker } from '@components/common/DatePicker/DateRangePicker';
import { DataTable } from '@components/common/DataTable/DataTable';
import { toISODateString, fromISODateString } from '@utils/dateRange';
import styles from './AdminPaymentsPage.module.scss';

const STATUS_LABEL = {
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  PENDING:  'Pendiente',
  CANCELLED:'Cancelado',
  REFUNDED: 'Reembolsado',
};

const GATEWAY_LABEL = {
  mercadopago: 'Mercado Pago',
  paypal:      'PayPal',
};

const STATUS_OPTIONS = [
  { value: '',          label: 'Todos' },
  { value: 'APPROVED',  label: 'Aprobado' },
  { value: 'REJECTED',  label: 'Rechazado' },
  { value: 'PENDING',   label: 'Pendiente' },
  { value: 'REFUNDED',  label: 'Reembolsado' },
];

const GATEWAY_OPTIONS = [
  { value: '',            label: 'Todos' },
  { value: 'mercadopago', label: 'Mercado Pago' },
  { value: 'paypal',      label: 'PayPal' },
];

function formatCurrency(value, currency = 'MXN') {
  if (value === null || value === undefined || value === '') return '—';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return value;
  return num.toLocaleString('es-MX', { style: 'currency', currency });
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function AdminPaymentsPage() {
  const [filters, setFilters] = useState({ status: '', gateway: '', from: '', to: '' });

  // Solo pasar los filtros no vacios al endpoint.
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== '' && v !== undefined && v !== null)
  );

  const { data, isLoading, isError } = useAdminPayments(params);
  const items  = data?.results ?? [];
  const totals = data?.totals;

  const setFilter = (key) => (e) => setFilters({ ...filters, [key]: e.target.value });

  const columns = useMemo(() => [
    { key: 'id', header: 'Pago', sortable: true, render: (p) => `#${p.id}` },
    { key: 'order_number', header: 'Orden', sortable: true },
    {
      key: 'gateway',
      header: 'Gateway',
      sortable: true,
      value: (p) => GATEWAY_LABEL[p.gateway] ?? p.gateway ?? '',
      render: (p) => GATEWAY_LABEL[p.gateway] ?? p.gateway ?? '—',
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      value: (p) => STATUS_LABEL[p.status] ?? p.status,
      render: (p) => (
        <span className={styles[`status_${p.status}`] || styles.statusDefault}>
          {STATUS_LABEL[p.status] ?? p.status}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Monto',
      sortable: true,
      align: 'right',
      // AdminPaymentSerializer exposes amount (no currency field —
      // model stores MXN only). Always default to 'MXN'.
      value: (p) => Number(p.amount ?? 0),
      render: (p) => formatCurrency(p.amount),
    },
    {
      key: 'created_at',
      header: 'Fecha',
      sortable: true,
      render: (p) => formatDate(p.created_at),
    },
    {
      key: 'actions',
      header: 'Acciones',
      // AdminPaymentSerializer has no is_refund field. Use status===REFUNDED
      // as the guard: an APPROVED payment that has been refunded transitions
      // to REFUNDED, so only payments still APPROVED can be refunded.
      render: (p) => (p.status === 'APPROVED' ? (
        <Link to={`/admin/payments/${p.id}/refund`} className={styles.refundLink}>
          Procesar reembolso
        </Link>
      ) : null),
    },
  ], []);

  return (
    <section className={styles.page} aria-labelledby="payments-report-title">
      <header className={styles.header}>
        <h1 id="payments-report-title" className={styles.title}>
          Reporte de transacciones
        </h1>
        <p className={styles.subtitle}>
          Pagos y reembolsos registrados vía Mercado Pago.
        </p>
      </header>

      <fieldset className={styles.filters} aria-label="Filtros">
        <label>Estado
          <select value={filters.status} onChange={setFilter('status')}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>Gateway
          <select value={filters.gateway} onChange={setFilter('gateway')}>
            {GATEWAY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <label>Rango de fechas
          {/* DateRangePicker (B2): reemplaza los dos <input type="date">.
              El backend espera ?from=&to= en formato `YYYY-MM-DD`; la
              conversion local preserva ese contrato sin desfase de zona. */}
          <DateRangePicker
            startDate={fromISODateString(filters.from)}
            endDate={fromISODateString(filters.to)}
            placeholder={['Desde', 'Hasta']}
            onRangeChange={({ startDate, endDate }) =>
              setFilters({
                ...filters,
                from: toISODateString(startDate),
                to:   toISODateString(endDate),
              })
            }
          />
        </label>
      </fieldset>

      {totals && (
        <ul className={styles.totals}>
          <li><strong>Aprobados:</strong> {formatCurrency(totals.approved)}</li>
          <li><strong>Reembolsados:</strong> {formatCurrency(totals.refunded)}</li>
          <li><strong>Neto:</strong> {formatCurrency(totals.net)}</li>
        </ul>
      )}

      {isLoading && <p>Cargando transacciones…</p>}
      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar las transacciones.
        </p>
      )}
      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No hay transacciones para el periodo seleccionado.</p>
      )}

      {items.length > 0 && (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(p) => p.id}
          caption="Lista de transacciones"
        />
      )}
    </section>
  );
}
