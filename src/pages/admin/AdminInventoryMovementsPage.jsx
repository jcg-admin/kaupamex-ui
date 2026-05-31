/**
 * AdminInventoryMovementsPage — PracticaYoruba
 * UC-INV-02: Movimientos tipo SALE (decremento por venta).
 * UC-INV-03: Movimientos tipo CANCELLATION (restauración por cancelación).
 * Tambien expone movimientos MANUAL (UC-INV-04) para auditoria completa.
 */
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useInventoryMovements } from '@hooks/domain/useInventory';
import styles from './AdminInventoryMovementsPage.module.scss';

// H-CICLO36-02: enum sync con apps/inventory/models.py:8-15.
// StockMovementSerializer expone el campo movement_type (no "type"), y el
// valor correcto para ajustes manuales es ADJUSTMENT (no MANUAL).
// Antes: mv.type siempre undefined → todas las filas mostraban "—" en Tipo;
// filtro "Ajuste manual" nunca coincidía con ningún movimiento.
const TYPE_FILTER_OPTIONS = [
  { value: '',            label: 'Todos los tipos' },
  { value: 'SALE',        label: 'Venta' },
  { value: 'CANCELLATION', label: 'Cancelación' },
  { value: 'ADJUSTMENT',  label: 'Ajuste manual' },
];

const TYPE_LABEL = {
  SALE:         'Venta',
  CANCELLATION: 'Cancelación',
  ADJUSTMENT:   'Ajuste manual',
};

const TYPE_CLASS = {
  SALE:         'badgeSale',
  CANCELLATION: 'badgeCancel',
  ADJUSTMENT:   'badgeManual',
};

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX');
}

function formatDelta(delta) {
  if (delta == null) return '—';
  return delta > 0 ? `+${delta}` : `${delta}`;
}

export default function AdminInventoryMovementsPage() {
  const { variantId } = useParams();
  const { data: movements = [], isLoading, isError } = useInventoryMovements(variantId);
  const [typeFilter, setTypeFilter] = useState('');

  const visibleMovements = useMemo(() => (
    typeFilter ? movements.filter((mv) => mv.movement_type === typeFilter) : movements
  ), [movements, typeFilter]);

  return (
    <section className={styles.page} aria-labelledby="inv-movements-title">
      <Link to="/admin/inventory" className={styles.backLink}>
        ← Volver al inventario
      </Link>

      <h1 id="inv-movements-title" className={styles.title}>
        Movimientos de inventario
      </h1>
      <p className={styles.meta}>Variante #{variantId}</p>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Filtrar por tipo</span>
          <select value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}>
            {TYPE_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Cargando movimientos…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar los movimientos.
        </p>
      )}

      {!isLoading && movements.length === 0 && (
        <p className={styles.empty}>Sin movimientos registrados.</p>
      )}

      {visibleMovements.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Delta</th>
              <th>Stock después</th>
              <th>Referencia</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {visibleMovements.map((mv) => (
              <tr key={mv.id}>
                <td>{formatDateTime(mv.created_at)}</td>
                <td>
                  <span className={styles[TYPE_CLASS[mv.movement_type]] || styles.badgeManual}>
                    {TYPE_LABEL[mv.movement_type] ?? mv.movement_type}
                  </span>
                </td>
                <td className={mv.delta < 0 ? styles.negative : styles.positive}>
                  {formatDelta(mv.delta)}
                </td>
                <td>{mv.stock_after ?? '—'}</td>
                <td>{mv.reference ?? '—'}</td>
                <td>{mv.reason ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
