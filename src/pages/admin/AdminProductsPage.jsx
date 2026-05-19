/**
 * AdminProductsPage — PracticaYoruba (D-011)
 *
 * Listado administrativo de productos con busqueda, filtro por
 * estado activo/inactivo y paginacion. Cada fila expone los enlaces
 * a las acciones por producto:
 *
 *   Editar     → /admin/products/:id/edit       (UC-CAT-10)
 *   Variantes  → /admin/products/:id/variants   (UC-CHT-03)
 *   Descuentos → /admin/products/:id/discounts  (UC-DASH-01..04)
 *
 * Lectura via React Query (`useAdminProducts`) — sin slice nuevo;
 * las mutaciones (crear/editar/desactivar) viven en las pantallas
 * de detalle correspondientes.
 *
 * GET /api/v1/admin/products/
 *   query params: page, search, is_active
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminProducts, ADMIN_PRODUCTS_KEY } from '@hooks/domain/useAdminProducts';
import {
  deactivateProduct, activateProduct, clearProductsActionState,
} from '@redux/slices/productsSlice';
import styles from './AdminProductsPage.module.scss';

const STATUS_OPTIONS = [
  { value: 'all',      label: 'Todos los estados' },
  { value: 'active',   label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

function formatPrice(value) {
  return Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 });
}

export default function AdminProductsPage() {
  const dispatch     = useDispatch();
  const queryClient  = useQueryClient();
  const { isActioning } = useSelector((s) => s.products);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [page,   setPage]   = useState(1);

  const handleToggle = async (product) => {
    const fn = product.is_active ? deactivateProduct : activateProduct;
    const result = await dispatch(fn(product.id));
    if (fn.fulfilled.match(result)) {
      dispatch(clearProductsActionState());
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY });
    }
  };

  const params = { page };
  if (search) params.search = search;
  if (status === 'active')   params.is_active = true;
  if (status === 'inactive') params.is_active = false;

  const { data, isLoading, isError } = useAdminProducts(params);
  const items    = data?.results ?? [];
  const count    = data?.count   ?? 0;
  const hasNext  = Boolean(data?.next);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatus = (e) => {
    setStatus(e.target.value);
    setPage(1);
  };

  return (
    <section className={styles.page} aria-labelledby="admin-products-title">
      <header className={styles.header}>
        <h1 id="admin-products-title" className={styles.title}>
          Productos
        </h1>
      </header>

      <div className={styles.filters}>
        <label className={styles.filter}>
          <span>Buscar</span>
          <input
            type="search"
            value={search}
            onChange={handleSearch}
            placeholder="Nombre o SKU"
            aria-label="Buscar productos"
          />
        </label>
        <label className={styles.filter}>
          <span>Estado</span>
          <select value={status} onChange={handleStatus} aria-label="Estado">
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading && <p>Cargando productos…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudo cargar el listado de productos.
        </p>
      )}

      {!isLoading && items.length === 0 && !isError && (
        <p className={styles.empty}>No se encontraron productos.</p>
      )}

      {items.length > 0 && (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoria</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>{p.category?.name ?? '—'}</td>
                  <td>${formatPrice(p.base_price)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <span className={p.is_active ? styles.badgeActive : styles.badgeInactive}>
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/products/${p.id}/edit`}
                            className={styles.actionLink}
                            aria-label={`Editar ${p.name}`}>
                        Editar
                      </Link>
                      <Link to={`/admin/products/${p.id}/variants`}
                            className={styles.actionLink}
                            aria-label={`Variantes de ${p.name}`}>
                        Variantes
                      </Link>
                      <Link to={`/admin/products/${p.id}/discounts`}
                            className={styles.actionLink}
                            aria-label={`Descuentos de ${p.name}`}>
                        Descuentos
                      </Link>
                      <button
                        type="button"
                        className={styles.actionLink}
                        onClick={() => handleToggle(p)}
                        disabled={isActioning}
                        aria-label={p.is_active
                          ? `Desactivar ${p.name}`
                          : `Reactivar ${p.name}`}
                      >
                        {p.is_active ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.pagination} aria-label="Paginacion">
            <span>
              {count} productos · Pagina {page}
            </span>
            <div>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </button>
              {' '}
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
