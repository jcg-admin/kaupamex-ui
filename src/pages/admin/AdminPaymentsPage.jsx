/**
 * AdminPaymentsPage — PracticaYoruba
 * UC-PAY-11: Reporte/listado de transacciones de pago para el admin
 * con filtros por estado, gateway y rango de fechas + totales del periodo.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminPayments } from '@hooks/domain/usePayments';
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

  return (
    <section className={styles.page} aria-labelledby="payments-report-title">
      <header className={styles.header}>
        <h1 id="payments-report-title" className={styles.title}>
          Reporte de transacciones
        </h1>
        <p className={styles.subtitle}>
          Pagos y reembolsos registrados via Mercado Pago y PayPal.
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
        <label>Desde
          <input type="date" value={filters.from} onChange={setFilter('from')} />
        </label>
        <label>Hasta
          <input type="date" value={filters.to} onChange={setFilter('to')} />
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
        <table className={styles.table} aria-label="Lista de transacciones">
          <thead>
            <tr>
              <th>Pago</th>
              <th>Orden</th>
              <th>Gateway</th>
              <th>Estado</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>{p.order_id}</td>
                <td>{GATEWAY_LABEL[p.gateway] ?? p.gateway ?? '—'}</td>
                <td className={styles[`status_${p.status}`] || styles.statusDefault}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </td>
                <td>{formatCurrency(p.amount, p.currency)}</td>
                <td>{formatDate(p.created_at || p.paid_at)}</td>
                <td>
                  {p.status === 'APPROVED' && !p.is_refund && (
                    <Link to={`/admin/payments/${p.id}/refund`} className={styles.refundLink}>
                      Procesar reembolso
                    </Link>
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
