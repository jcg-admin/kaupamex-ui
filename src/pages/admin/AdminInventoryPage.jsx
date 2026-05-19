/**
 * AdminInventoryPage — PracticaYoruba
 * UC-INV-01: Ver stock actual de productos
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInventory } from '@hooks/domain/useInventory';
import styles from './AdminInventoryPage.module.scss';

const STATUS_OPTIONS = [
  { value: '',         label: 'Todos los estados' },
  { value: 'NORMAL',   label: 'Normal' },
  { value: 'BAJO',     label: 'Bajo stock' },
  { value: 'AGOTADO',  label: 'Agotado' },
];

const STATUS_LABEL = {
  NORMAL:  'Normal',
  BAJO:    'Bajo',
  AGOTADO: 'Agotado',
};

const STATUS_CLASS = {
  NORMAL:  'badgeNormal',
  BAJO:    'badgeWarn',
  AGOTADO: 'badgeDanger',
};

export default function AdminInventoryPage() {
  const [filters, setFilters] = useState({ status: '' });
  const params = filters.status ? { status: filters.status } : {};
  const { data, isLoading, isError } = useInventory(params);
  const items   = data?.results ?? data?.productos ?? (Array.isArray(data) ? data : []);
  const summary = data?.summary ?? data?.resumen ?? null;

  const counts = useMemo(() => ({
    normales: summary?.productos_normales   ?? 0,
    bajos:    summary?.productos_bajo_stock ?? 0,
    agotados: summary?.productos_agotados   ?? 0,
  }), [summary]);

  return (
    <section className={styles.page} aria-labelledby="admin-inventory-title">
      <header className={styles.header}>
        <h1 id="admin-inventory-title" className={styles.title}>
          Inventario
        </h1>
        <Link to="/admin/inventory/import" className={styles.importLink}>
          Importar CSV
        </Link>
      </header>

      <div className={styles.summary} aria-label="Resumen de inventario">
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Normales</span>
          <span className={styles.metricValue}>{counts.normales}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Bajo stock</span>
          <span className={styles.metricValue}>{counts.bajos}</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricLabel}>Agotados</span>
          <span className={styles.metricValue}>{counts.agotados}</span>
        </div>
      </div>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Estado</span>
          <select
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Cargando inventario…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el inventario. Intenta de nuevo.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No hay productos en inventario.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Stock</th>
              <th>Umbral</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.variant_id}>
                <td>{it.sku}</td>
                <td>{it.product_name}</td>
                <td>{it.stock}</td>
                <td>{it.min_threshold}</td>
                <td>
                  <span className={styles[STATUS_CLASS[it.status]] || styles.badgeNormal}>
                    {STATUS_LABEL[it.status] ?? it.status}
                  </span>
                </td>
                <td>
                  <Link to={`/admin/inventory/${it.variant_id}/adjust`}
                        className={styles.actionLink}>
                    Ajustar
                  </Link>
                  {' · '}
                  <Link to={`/admin/inventory/${it.variant_id}/movements`}
                        className={styles.actionLink}>
                    Movimientos
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
