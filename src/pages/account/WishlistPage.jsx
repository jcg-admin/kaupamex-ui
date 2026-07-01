/**
 * WishlistPage — Práctica Yorùbà
 * Lista de deseos con badges (bajó precio, última unidad) + move-to-cart.
 *
 * Endpoints:
 *   GET /wishlist/
 *   DELETE /wishlist/{pk}/
 *   POST /wishlist/{pk}/cart-transfers/
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchWishlist, removeFromWishlist, moveWishlistItemToCart } from '@redux/slices/wishlistSlice';
import { fetchCart } from '@redux/slices/cartSlice';
import { addToast } from '@redux/slices/uiSlice';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Price, Button, EmptyState } from '@components/common/primitives';
import useSortableList, { arrayMove } from '@hooks/ui/useSortableList';
import styles from './WishlistPage.module.scss';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { items = [], isLoading } = useSelector((s) => s.wishlist || {});
  const [movingAll, setMovingAll]   = useState(false);
  const [moveErrors, setMoveErrors] = useState([]);

  // Orden local (Fase 5, drag-n-drop): reordenamiento en sesión. Se resincroniza
  // cuando cambia la lista del backend (fetch/add/remove/move). La persistencia
  // del orden requiere un campo `order` en el API (follow-up documentado).
  const [sorted, setSorted] = useState(items);
  useEffect(() => { setSorted(items); }, [items]);
  const handleReorder = (from, to) => setSorted((prev) => arrayMove(prev, from, to));
  const { getItemProps } = useSortableList(sorted.length, handleReorder);

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  /**
   * H-WL-03: mover una pieza al carrito no refrescaba el carrito ni avisaba.
   * Tras un move exitoso se refresca el carrito (para que el contador del
   * header se actualice) y se muestra un toast de confirmación.
   */
  const handleMoveOne = async (item) => {
    try {
      await dispatch(moveWishlistItemToCart({ itemId: item.id })).unwrap();
      dispatch(fetchCart());
      dispatch(addToast({ type: 'success', message: `"${item.product_name}" se movió al carrito.` }));
    } catch (err) {
      dispatch(addToast({
        type: 'error',
        message: err?.message || 'No se pudo mover la pieza al carrito.',
      }));
    }
  };

  /**
   * H-001: "Mover todo al carrito" ejecutaba un bucle `for … await` que
   * despachaba los items uno a uno; con N piezas la UI quedaba bloqueada
   * ~N×latencia sin retroalimentacion, y si una pieza fallaba (p. ej. sin
   * stock) el bucle abortaba y las restantes nunca se movian.
   *
   * Ahora se despachan en paralelo con Promise.allSettled: cada pieza se
   * intenta de forma independiente, se reporta cual fallo y el resto avanza.
   */
  const handleMoveAll = async () => {
    const snapshot = items;           // congela la lista al momento del clic
    setMovingAll(true);
    setMoveErrors([]);
    const results = await Promise.allSettled(
      snapshot.map((i) => dispatch(moveWishlistItemToCart({ itemId: i.id })).unwrap()),
    );
    const errors = [];
    results.forEach((r, idx) => {
      if (r.status === 'rejected') {
        errors.push({
          id:      snapshot[idx].id,
          name:    snapshot[idx].product_name,
          message: r.reason?.message || 'No se pudo mover al carrito.',
        });
      }
    });
    setMoveErrors(errors);
    setMovingAll(false);
    // H-WL-03: refrescar el carrito y avisar el resultado (antes: sin feedback
    // y el contador del header quedaba desactualizado).
    const moved = results.length - errors.length;
    if (moved > 0) {
      dispatch(fetchCart());
      dispatch(addToast({
        type: 'success',
        message: `${moved} ${moved === 1 ? 'pieza movida' : 'piezas movidas'} al carrito.`,
      }));
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/account">Mi cuenta</Link>
          <span>/</span>
          <span className={styles.bcCurrent}>Mis deseos</span>
        </nav>

        <div className={styles.layout}>
          <AccountSidebar />

          <section>
            <header className={styles.header}>
              <div>
                <MetaTag tone="bronze">{items.length} {items.length === 1 ? 'pieza guardada' : 'piezas guardadas'}</MetaTag>
                <h1 className={styles.title}>Lista de deseos</h1>
                <p className={styles.lead}>
                  Piezas que guardaste para más adelante. Te avisamos si bajan de precio
                  o si llega su última unidad.
                </p>
              </div>
              {items.length > 0 && (
                <Button variant="secondary" onClick={handleMoveAll} disabled={movingAll}>
                  {movingAll ? 'Moviendo…' : 'Mover todo al carrito'}
                </Button>
              )}
            </header>

            {moveErrors.length > 0 && (
              <div className={styles.moveErrors} role="alert">
                <p>No se pudieron mover algunas piezas:</p>
                <ul>
                  {moveErrors.map((e) => (
                    <li key={e.id}>{e.name}: {e.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {isLoading && <div className={styles.loading}>Cargando…</div>}

            {!isLoading && items.length === 0 && (
              <EmptyState
                icon="♡"
                title="No tienes piezas guardadas"
                description="Cuando encuentres una pieza que quieras pero no quieras comprar ahora, guárdala aquí."
              >
                <Link to="/catalog"><Button variant="primary">Ir al catálogo</Button></Link>
              </EmptyState>
            )}

            {!isLoading && items.length > 0 && (
              <>
                {sorted.length > 1 && (
                  <p className={styles.reorderHint}>
                    Arrastra las piezas (o Ctrl + ↑/↓) para ordenarlas a tu gusto.
                  </p>
                )}
                <div className={styles.grid} data-testid="wishlist-grid">
                  {sorted.map((it, i) => (
                    <WishItem
                      key={it.id}
                      item={it}
                      dispatch={dispatch}
                      onMove={handleMoveOne}
                      dragProps={getItemProps(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function WishItem({ item, dispatch, onMove, dragProps = {} }) {
  const priceChanged = item.price_at_add && item.current_price < item.price_at_add;
  const lowStock = item.is_available && item.stock <= 3;

  return (
    <article className={`${styles.wishCard} ${styles.wishCardDraggable}`} {...dragProps}>
      <div className={styles.wishImg}>
        {item.image_url
          ? <img src={item.image_url} alt={item.product_name} loading="lazy" />
          : <div className={styles.wishImgPlaceholder}>{item.product_name}</div>}
        {priceChanged && <span className={`${styles.badge} ${styles.badgeLime}`}>Bajó de precio</span>}
        {lowStock && <span className={`${styles.badge} ${styles.badgeVino}`}>Última unidad</span>}
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => dispatch(removeFromWishlist(item.id))}
          aria-label="Quitar de deseos"
        >×</button>
      </div>
      <div className={styles.wishBody}>
        <div className={styles.wishTags}>
          {item.category_name && <MetaTag tone="bronze">{item.category_name}</MetaTag>}
          {item.orisha_name && <MetaTag tone="coral">{item.orisha_name}</MetaTag>}
        </div>
        <h3 className={styles.wishName}>{item.product_name}</h3>
        <div className={styles.wishPrices}>
          <Price amount={item.current_price} size="md" />
          {priceChanged && (
            <span className={styles.wishPriceWas}>
              ${item.price_at_add.toLocaleString('es-MX')}
            </span>
          )}
        </div>
        <Button variant="primary" block size="sm" onClick={() => onMove(item)}>
          Mover al carrito
        </Button>
      </div>
    </article>
  );
}
