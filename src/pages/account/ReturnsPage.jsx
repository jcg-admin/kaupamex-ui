/**
 * ReturnsPage — PracticaYoruba
 * UC-RET-04: Listar devoluciones del comprador autenticado.
 *
 * Lectura via React Query (`useReturns`). Las mutaciones (UC-RET-01)
 * permanecen en `returnsSlice`.
 */
import { Link } from 'react-router-dom';
import { useReturns } from '@hooks/domain/useReturns';
import { RETURN_STATUS_LABEL, RETURN_STATUS_CLASS } from './returnStatus';
import styles from './ReturnsPage.module.scss';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function ReturnsPage() {
  const { data: items = [], isLoading, isError } = useReturns();

  return (
    <section className={styles.page} aria-labelledby="returns-title">
      <header className={styles.header}>
        <h1 id="returns-title" className={styles.title}>
          Mis devoluciones
        </h1>
        <Link to="/account/returns/new" className={styles.primaryBtn}>
          Solicitar devolución
        </Link>
      </header>

      {isLoading && <p>Cargando devoluciones…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar tus devoluciones. Intenta de nuevo.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>
          No tienes devoluciones registradas.
        </p>
      )}

      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((ret) => (
            <li key={ret.id} className={styles.item}>
              <Link to={`/account/returns/${ret.id}`} className={styles.itemLink}>
                <div className={styles.itemMain}>
                  <span className={styles.itemOrder}>{ret.order_id}</span>
                  <span className={styles.itemId}>Devolución #{ret.id}</span>
                </div>
                <div className={styles.itemMeta}>
                  <span
                    className={styles[RETURN_STATUS_CLASS[ret.status]] || styles.badgePending}
                  >
                    {RETURN_STATUS_LABEL[ret.status] ?? ret.status}
                  </span>
                  <span className={styles.itemDate}>{formatDate(ret.created_at)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
