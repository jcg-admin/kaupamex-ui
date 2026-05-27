/**
 * AdminInventoryPage — PracticaYoruba
 * UC-INV-01: Ver stock actual de productos
 * H-CICLO104-06: Agregar controles de paginacion. La API de InventoryDashboardView
 * devuelve pagination.{page,total_pages,page_size,total} pero el componente
 * no tenia forma de navegar a paginas siguientes, limitando la vista a la
 * primera pagina de 50 items y ocultando el resto del inventario.
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
  const [page, setPage] = useState(1);
  const params = { ...(filters.status ? { status: filters.status } : {}), page };
  const { data, isLoading, isError } = useInventory(params);
  const items      = data?.results ?? data?.productos ?? (Array.isArray(data) ? data : []);
  const summary    = data?.summary ?? data?.resumen ?? null;
  const pagination = data?.pagination ?? null;
  const totalPages = pagination?.total_pages ?? 1;
  const currentPage = pagination?.page ?? page;

  const counts = useMemo(() => ({
    normales: summary?.normal ?? 0,
    bajos:    summary?.low    ?? 0,
    agotados: summary?.out    ?? 0,
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
            onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
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
              /* H-CICLO23-06: productos sin variantes tienen variant_id=null;
                 usar null como key React causa colisiones. Se construye una
                 key única combinando product_id y variant_id. */
              <tr key={it.variant_id != null ? `v-${it.variant_id}` : `p-${it.product_id}`}>
                <td>{it.sku}</td>
                <td>{it.product_name}</td>
                <td>{it.stock}</td>
                <td>{it.threshold}</td>
                <td>
                  <span className={styles[STATUS_CLASS[it.status]] || styles.badgeNormal}>
                    {STATUS_LABEL[it.status] ?? it.status}
                  </span>
                </td>
                <td>
                  {it.variant_id != null ? (
                    <>
                      <Link to={`/admin/inventory/${it.variant_id}/adjust`}
                            className={styles.actionLink}>
                        Ajustar
                      </Link>
                      {' · '}
                      <Link to={`/admin/inventory/${it.variant_id}/movements`}
                            className={styles.actionLink}>
                        Movimientos
                      </Link>
                    </>
                  ) : (
                    <span className={styles.noVariant}>Sin variante</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* H-CICLO104-06: controles de paginacion. Sin ellos el usuario solo
          ve la primera pagina (50 items) y no puede acceder al resto del
          inventario cuando hay mas de 50 SKUs. */}
      {totalPages > 1 && (
        <div className={styles.pagination} aria-label="Paginacion de inventario">
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            aria-label="Pagina anterior"
          >
            ← Anterior
          </button>
          <span className={styles.pageInfo}>
            Pagina {currentPage} de {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Pagina siguiente"
          >
            Siguiente →
          </button>
        </div>
      )}
    </section>
  );
}
