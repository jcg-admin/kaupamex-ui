/**
 * WishlistPage — PracticaYoruba
 *
 *   UC-WISH-02 — Ver la lista de deseos del comprador autenticado.
 *   UC-WISH-03 — Mover producto de la lista al carrito.
 *
 * Lectura via React Query (useWishlist), mutaciones via wishlistSlice
 * preservando lastAction para mostrar confirmaciones (canonical D-010).
 */
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useWishlist, WISHLIST_KEY } from '@hooks/domain/useWishlist';
import {
  removeFromWishlist,
  moveWishlistItemToCart,
  clearWishlistActionState,
} from '@redux/slices/wishlistSlice';
import styles from './WishlistPage.module.scss';

const FILTERS = [
  { value: '',             label: 'Todos' },
  { value: 'IN_STOCK',     label: 'Con stock' },
  { value: 'OUT_OF_STOCK', label: 'Sin stock' },
];

function priceLabel(item) {
  const product = item.product ?? {};
  return product.price_with_tax ?? product.base_price ?? 0;
}

export default function WishlistPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState('');
  const params = filter ? { availability: filter } : {};

  const { data, isLoading, isError } = useWishlist(params);

  const isActioning = useSelector((s) => s.wishlist?.isActioning);
  const actionError = useSelector((s) => s.wishlist?.actionError);
  const lastAction  = useSelector((s) => s.wishlist?.lastAction);

  const items = data?.items ?? [];
  const totalItems = data?.total_items ?? items.length;
  const outOfStockCount = data?.items_out_of_stock ?? 0;

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: WISHLIST_KEY });
  }, [queryClient]);

  const handleRemove = useCallback(async (itemId) => {
    dispatch(clearWishlistActionState());
    const result = await dispatch(removeFromWishlist(itemId));
    if (removeFromWishlist.fulfilled.match(result)) invalidate();
  }, [dispatch, invalidate]);

  const handleMoveToCart = useCallback(async (itemId, keepInWishlist = false) => {
    dispatch(clearWishlistActionState());
    const result = await dispatch(
      moveWishlistItemToCart({ itemId, keepInWishlist }),
    );
    if (moveWishlistItemToCart.fulfilled.match(result)) invalidate();
  }, [dispatch, invalidate]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Lista de deseos</h1>
        <p className={styles.subtitle}>
          {totalItems > 0
            ? `${totalItems} ${totalItems === 1 ? 'producto guardado' : 'productos guardados'}`
            : 'Aun no has guardado productos.'}
          {outOfStockCount > 0 && ` · ${outOfStockCount} sin stock`}
        </p>
      </header>

      <div className={styles.filters} role="tablist" aria-label="Filtros de disponibilidad">
        {FILTERS.map((f) => (
          <button
            key={f.value || 'all'}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p className={styles.error} role="alert">
          {actionError.code === 'PRODUCTO_SIN_STOCK'
            ? 'Este producto ya no tiene stock disponible.'
            : actionError.message || 'No se pudo completar la accion.'}
        </p>
      )}

      {lastAction === 'moved' && !actionError && (
        <p className={styles.success} role="status">
          Producto movido al carrito.
        </p>
      )}

      {isLoading && (
        <div className={styles.loading} aria-live="polite">
          <div className={styles.spinner} />
          <p>Cargando lista...</p>
        </div>
      )}

      {isError && !isLoading && (
        <p className={styles.error} role="alert">
          No se pudo cargar la lista. Intenta de nuevo.
        </p>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className={styles.empty}>
          Tu lista de deseos esta vacia. Explora el{' '}
          <Link to="/catalog">catalogo</Link> para guardar productos.
        </p>
      )}

      {!isLoading && items.length > 0 && (
        <ul className={styles.items}>
          {items.map((item) => {
            const product = item.product ?? {};
            const inStock = item.availability !== 'OUT_OF_STOCK';
            const productName = product.name ?? 'Producto';
            return (
              <li key={item.id} className={styles.item}>
                {product.image && (
                  <img
                    src={product.image}
                    alt={productName}
                    className={styles.image}
                  />
                )}
                <div className={styles.info}>
                  <h2 className={styles.itemTitle}>
                    {product.slug ? (
                      <Link to={`/catalog/${product.slug}`}>{productName}</Link>
                    ) : (
                      productName
                    )}
                  </h2>
                  <div className={styles.priceRow}>
                    <strong className={styles.price}>
                      ${priceLabel(item).toLocaleString('es-MX')}
                    </strong>
                    {item.price_dropped && (
                      <span className={styles.priceDrop}>
                        Rebaja {item.price_drop_percent}%
                      </span>
                    )}
                  </div>
                  <span
                    className={inStock ? styles.inStock : styles.outOfStock}
                  >
                    {inStock ? 'Disponible' : 'Sin stock'}
                  </span>
                </div>
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.moveBtn}
                    disabled={!inStock || isActioning}
                    onClick={() => handleMoveToCart(item.id)}
                    aria-label={`Mover ${productName} al carrito`}
                  >
                    Mover al carrito
                  </button>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    disabled={isActioning}
                    onClick={() => handleRemove(item.id)}
                    aria-label={`Eliminar ${productName} de la lista`}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
