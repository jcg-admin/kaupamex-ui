/**
 * AdminChargebacksPage — PracticaYoruba
 * T-17-B: lista de contracargos recibidos via webhook de MercadoPago.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminChargebacks } from '@hooks/domain/usePayments';
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

      {isLoading && <p className={styles.info}>Cargando contracargos…</p>}
      {isError   && <p role="alert" className={styles.error}>Error al cargar contracargos.</p>}

      {!isLoading && !isError && chargebacks.length === 0 && (
        <p className={styles.info}>No hay contracargos registrados.</p>
      )}

      {chargebacks.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID Gateway</th>
              <th>Pago MP</th>
              <th>Monto</th>
              <th>Estado</th>
              <th>Razon</th>
              <th>Fecha</th>
              <th>Detalle</th>
            </tr>
          </thead>
          <tbody>
            {chargebacks.map((cb) => (
              <tr key={cb.id}>
                <td className={styles.mono}>{cb.gateway_chargeback_id}</td>
                <td className={styles.mono}>{cb.gateway_payment_id}</td>
                <td>{formatCurrency(cb.amount)}</td>
                <td>
                  <span className={`${styles.badge} ${styles[`badge_${cb.status}`]}`}>
                    {cb.status}
                  </span>
                </td>
                <td>{cb.reason_code || '—'}</td>
                <td>{formatDate(cb.created_at)}</td>
                <td>
                  <Link to={`/admin/chargebacks/${cb.id}`} className={styles.link}>
                    Ver
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
