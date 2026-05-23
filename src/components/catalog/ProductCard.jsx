/**
 * ProductCard — Práctica Yorùbà
 * Tarjeta de producto editorial:
 *   · imagen (aspect 4/5), tag categoría, tag òrìsà, nombre, precio
 *   · badge Destacado / Oferta / Sin stock
 *   · botón flotante de wishlist
 *
 * product = {
 *   id, name, slug, sku,
 *   base_price, price_with_tax,
 *   category_name, orisha_name,
 *   stock, is_featured, has_discount,
 *   image_url,
 *   highlighted_name,
 * }
 */

import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToWishlist, removeFromWishlist } from '@redux/slices/wishlistSlice';
import styles from './ProductCard.module.scss';

function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(amount));
}

export default function ProductCard({ product, inWishlist = false }) {
  const dispatch = useDispatch();
  if (!product) return null;

  const {
    id, name, slug, sku,
    base_price, price_with_tax,
    category_name, orisha_name,
    stock, is_featured, has_discount,
    image_url,
    highlighted_name,
  } = product;

  const isAvailable = stock > 0;
  const originalPrice = has_discount ? base_price : null;
  const displayPrice = price_with_tax || base_price;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inWishlist) {
      dispatch(removeFromWishlist({ productId: id }));
    } else {
      dispatch(addToWishlist({ productId: id }));
    }
  };

  return (
    <article className={styles.card}>
      <Link to={`/catalog/${slug}`} className={styles.imageLink}>
        <div className={styles.imageArea}>
          {image_url ? (
            <img
              src={image_url}
              alt={name}
              className={styles.image}
              loading="lazy"
            />
          ) : (
            <div className={styles.imagePlaceholder} aria-hidden="true">
              <span className={styles.placeholderSku}>{sku}</span>
            </div>
          )}

          {is_featured && (
            <span className={`${styles.badge} ${styles.badgeFeatured}`}>
              Destacado
            </span>
          )}
          {has_discount && (
            <span className={`${styles.badge} ${styles.badgeOffer}`}>
              Oferta
            </span>
          )}
          {!isAvailable && (
            <span className={`${styles.badge} ${styles.badgeOut}`}>
              Sin stock
            </span>
          )}

          <button
            type="button"
            className={`${styles.wishBtn} ${inWishlist ? styles.wishBtnActive : ''}`}
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Quitar de deseos' : 'Añadir a deseos'}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      </Link>

      <div className={styles.info}>
        <div className={styles.tags}>
          {category_name && (
            <span className={`${styles.tag} ${styles.tagCategory}`}>
              {category_name}
            </span>
          )}
          {orisha_name && (
            <span className={`${styles.tag} ${styles.tagOrisha}`}>
              {orisha_name}
            </span>
          )}
        </div>

        <h3
          className={styles.name}
          dangerouslySetInnerHTML={{ __html: highlighted_name || name }}
        />

        <div className={styles.pricing}>
          <span className={styles.price}>
            {formatPrice(displayPrice)}
          </span>
          {originalPrice && (
            <span className={styles.priceWas}>
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
