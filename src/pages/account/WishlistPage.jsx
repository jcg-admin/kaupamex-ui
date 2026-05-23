import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchWishlist, removeFromWishlist, moveWishlistItemToCart } from '@redux/slices/wishlistSlice';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Price, Button, EmptyState } from '@components/common/primitives';
import styles from './WishlistPage.module.scss';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { items = [], isLoading } = useSelector((s) => s.wishlist || {});

  useEffect(() => { dispatch(fetchWishlist()); }, [dispatch]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/account">Mi cuenta</Link>
          <span>/</span>
          <span className={styles.bcCurrent}>Lista de deseos</span>
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
                <Button variant="secondary" onClick={() => items.forEach(i => dispatch(moveWishlistItemToCart(i.id)))}>
                  Mover todo al carrito
                </Button>
              )}
            </header>

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
              <div className={styles.grid}>
                {items.map((it) => <WishItem key={it.id} item={it} dispatch={dispatch} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function WishItem({ item, dispatch }) {
  const priceChanged = item.price_at_add && item.current_price < item.price_at_add;
  const lowStock = item.is_available && item.stock <= 3;

  return (
    <article className={styles.wishCard}>
      <div className={styles.wishImg}>
        {item.image_url
          ? <img src={item.image_url} alt={item.product_name} />
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
        <Button variant="primary" block size="sm" onClick={() => dispatch(moveWishlistItemToCart(item.id))}>
          Mover al carrito
        </Button>
      </div>
    </article>
  );
}
