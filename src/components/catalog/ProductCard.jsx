/**
 * ProductCard — Práctica Yorùbà
 * Tarjeta de producto editorial con:
 *   · imagen (aspect 4/5) — usa product.cover_image_url o placeholder
 *   · tag de categoría (eleke, otán, herramienta, libro…)
 *   · tag de òrìsà (Yemayá, Shangó, Oshún…) — viene de product.orisha_name
 *   · nombre del producto
 *   · precio formateado en MXN
 *   · badge "Destacado" / "Oferta" si aplica
 *   · botón flotante de wishlist
 *
 * Compatible con la estructura del backend Django:
 *   product = {
 *     id, name, slug, sku,
 *     base_price, price_with_tax,
 *     category_name, orisha_name,    // <- nuevos campos
 *     stock, is_featured, has_discount,
 *     cover_image_url,               // campo real del API (ProductListSerializer)
 *     highlighted_name,
 *   }
 */

import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import DOMPurify from 'dompurify';
import { toggleWishlist, addToWishlist, removeFromWishlist } from '@redux/slices/wishlistSlice';
import { useToast } from '@context/ToastContext';
import styles from './ProductCard.module.scss';

function formatPrice(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', minimumFractionDigits: 0,
  }).format(Number(amount));
}

export default function ProductCard({ product, inWishlist = false }) {
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated);
  const { error: toastError } = useToast();
  if (!product) return null;

  const {
    id, name, slug, sku,
    base_price, price_with_tax,
    category_name, orisha_name,
    stock, is_featured, has_discount,
    // H-CICLO83-02: el API expone cover_image_url (ProductListSerializer),
    // no image_url. El campo incorrecto causaba que ninguna imagen se
    // mostrara en las tarjetas del catálogo (cover_image_url era undefined).
    cover_image_url,
    highlighted_name,
  } = product;

  // Alias para backward-compat: si algún caller pasa image_url directamente
  // (e.g. WishlistPage, SearchPage) seguir funcionando sin cambios en esas vistas.
  const image_url = cover_image_url ?? product.image_url;

  const isAvailable = stock > 0;
  const originalPrice = has_discount ? base_price : null;
  const displayPrice = price_with_tax || base_price;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    // toggleWishlist delegates to addToWishlist / removeFromWishlist.
    // Those thunks update state.wishlist.actionError on failure.  We inspect
    // the inner action's type to detect rejection without relying on
    // toggleWishlist.rejected (which never fires because the thunk function
    // itself does not throw or rejectWithValue).
    const outerResult = await dispatch(toggleWishlist({ productId: id }));
    const innerAction = outerResult?.payload;
    if (innerAction && addToWishlist.rejected.match(innerAction)
        || innerAction && removeFromWishlist.rejected.match(innerAction)) {
      toastError('No se pudo actualizar la lista de deseos');
    }
  };

  return (
    <article className={styles.card}>
      <Link to={`/catalogo/${slug}`} className={styles.imageLink}>
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
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(highlighted_name || name) }}
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
