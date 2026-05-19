/**
 * AdminProductDiscountsPage — PracticaYoruba
 * UC-DASH-04: Ver descuentos activos del catalogo
 *
 * Lista todos los ProductDiscount con is_active=True, clasificados por
 * estado de vigencia (CURRENT / FUTURE / EXPIRED) calculado por el
 * backend a partir de valid_from / valid_until.
 *
 * Punto de entrada operacional para UC-DASH-01 (crear),
 * UC-DASH-02 (editar) y UC-DASH-03 (desactivar).
 */
import { useState } from 'react';
import { useProductDiscounts } from '@hooks/domain/useProductDiscounts';
import styles from './AdminProductDiscountsPage.module.scss';

const STATUS_OPTIONS = [
  { value: '',         label: 'Todos los estados' },
  { value: 'CURRENT',  label: 'Vigentes' },
  { value: 'FUTURE',   label: 'Futuras' },
  { value: 'EXPIRED',  label: 'Vencidas' },
];

const STATUS_LABEL = {
  CURRENT: 'Vigente',
  FUTURE:  'Futura',
  EXPIRED: 'Vencida',
};

const STATUS_CLASS = {
  CURRENT: 'badgeCurrent',
  FUTURE:  'badgeFuture',
  EXPIRED: 'badgeExpired',
};

function formatPct(pct) {
  if (pct === null || pct === undefined) return '—';
  const n = Number(pct);
  return `${Number.isInteger(n) ? n : n.toFixed(2)}%`;
}

function formatPrice(price) {
  if (price === null || price === undefined) return '—';
  return `$${Number(price).toFixed(2)}`;
}

function formatValidity(from, until) {
  if (!from && !until) return '—';
  const fromTxt  = from  ?? '—';
  const untilTxt = until ?? 'Sin vencimiento';
  return `${fromTxt} → ${untilTxt}`;
}

export default function AdminProductDiscountsPage() {
  const [filters, setFilters] = useState({ status: '' });
  const params = filters.status ? { status: filters.status } : {};
  const { data, isLoading, isError } = useProductDiscounts(params);
  const items = Array.isArray(data) ? data : [];

  return (
    <section className={styles.page} aria-labelledby="discounts-title">
      <header className={styles.header}>
        <h1 id="discounts-title" className={styles.title}>
          Descuentos de Producto
        </h1>
        <button type="button" className={styles.primaryBtn}>
          Nuevo descuento
        </button>
      </header>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Estado</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value })}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Cargando descuentos…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar los descuentos. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className={styles.empty}>No hay descuentos activos.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Descuento</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td>{d.product_name}</td>
                <td>{formatPct(d.discount_pct)}</td>
                <td>{formatValidity(d.valid_from, d.valid_until)}</td>
                <td>
                  <span className={styles[STATUS_CLASS[d.status]] || ''}>
                    {STATUS_LABEL[d.status] ?? d.status}
                  </span>
                </td>
                <td>
                  <span className={styles.priceOriginal}>
                    {formatPrice(d.original_price)}
                  </span>
                  <span>{formatPrice(d.discounted_price)}</span>
                </td>
                <td>{/* Acciones pendientes — UC-DASH-02 / UC-DASH-03 */}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
