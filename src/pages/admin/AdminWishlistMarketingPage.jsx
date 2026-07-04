/**
 * AdminWishlistMarketingPage — PracticaYoruba
 * UC-WISH-04 (H-08): productos más deseados por los clientes (marketing).
 *
 * Muestra, por producto, cuántas veces está en listas de deseos y cuántos
 * clientes distintos lo desean. Insumo para campañas, reposición y descuentos
 * dirigidos. Solo agregados anónimos (BR-013): no se expone qué cliente desea
 * qué pieza.
 */
import { useAdminWishlistAggregate } from '@hooks/domain/useAdminWishlistAggregate';
import styles from './AdminWishlistMarketingPage.module.scss';

export default function AdminWishlistMarketingPage() {
  const { data, isLoading, isError } = useAdminWishlistAggregate();
  const rows = data?.results ?? [];

  return (
    <section className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Productos más deseados</h1>
        <p className={styles.lead}>
          Qué piezas guardan más tus clientes en su lista de deseos. Útil para
          campañas, reposición de inventario y descuentos dirigidos. Los datos
          son agregados y anónimos.
        </p>
      </header>

      {isLoading && <p className={styles.state}>Cargando…</p>}
      {isError && (
        <p className={styles.state} role="alert">
          No se pudo cargar el reporte. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <p className={styles.state} data-testid="wishlist-marketing-empty">
          Aún no hay productos en listas de deseos.
        </p>
      )}

      {rows.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table} data-testid="wishlist-marketing-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th className={styles.num}>Veces deseado</th>
                <th className={styles.num}>Clientes distintos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.product_id}>
                  <td>{r.name}</td>
                  <td className={styles.num}>{r.times_wishlisted}</td>
                  <td className={styles.num}>{r.distinct_users}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
