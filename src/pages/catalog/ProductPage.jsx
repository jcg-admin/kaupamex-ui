/**
 * ProductPage — Práctica Yorùbà
 * Detalle de producto con galería, selector de variantes,
 * trust strip y descripción extendida.
 *
 * Endpoints:
 *   GET /catalogue/{slug}/
 *   POST /cart/items/
 *   POST /wishlist/
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { sanitizeHtml } from '@lib/sanitize';
import { fetchProduct } from '@redux/slices/catalogSlice';
import { addToCart } from '@redux/slices/cartSlice';
import { toggleWishlist, addToWishlist, removeFromWishlist } from '@redux/slices/wishlistSlice';
import { useProductReviews } from '@hooks/domain/useReviews';
import { useToast } from '@context/ToastContext';
import ProductCard from '@components/catalog/ProductCard';
import ReviewItem from '@components/catalog/ReviewItem';
import { MetaTag, Price, Button } from '@components/common/primitives';
import styles from './ProductPage.module.scss';

export default function ProductPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error: toastError } = useToast();
  const product = useSelector((s) => s.catalog?.currentProduct);
  const isLoading = useSelector((s) => s.catalog?.isLoading);
  const wishlistItems = useSelector((s) => s.wishlist?.items ?? []);

  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const { data: reviewsData } = useProductReviews(product?.id, { page_size: 3 });
  const previewReviews = reviewsData?.items ?? [];
  const reviewsAvg     = reviewsData?.average_rating ?? 0;
  const reviewsTotal   = reviewsData?.total_reviews ?? 0;

  useEffect(() => { dispatch(fetchProduct(slug)); }, [dispatch, slug]);
  useEffect(() => {
    if (product?.variants?.length > 0) setVariant(product.variants[0]);
  }, [product]);

  if (isLoading || !product) {
    return <div className={styles.loading}>Cargando…</div>;
  }

  const images = product.images || [];
  const effectivePrice = variant?.price_override ?? product.price_with_tax ?? product.base_price;
  const stock = variant?.stock ?? product.stock;
  const isAvailable = stock > 0;
  const related = product.related_products || [];
  const inWishlist = wishlistItems.some(
    (i) => i.product?.id === product.id || i.product_id === product.id,
  );

  const handleAddToCart = () => {
    dispatch(addToCart({
      productId: product.id,
      variantId: variant?.id,
      quantity: qty,
    }));
    navigate('/cart');
  };

  return (
    <main className={styles.page}>
      <section className={styles.main}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb}>
            <Link to="/">Inicio</Link><span>/</span>
            <Link to="/catalog">Catálogo</Link><span>/</span>
            {product.category_name && (<><Link to={`/catalog?cat=${product.category_slug}`}>{product.category_name}</Link><span>/</span></>)}
            {product.orisha_name && (<><Link to={`/catalog?orisha=${product.orisha_slug}`}>{product.orisha_name}</Link><span>/</span></>)}
            <span className={styles.bcCurrent}>{product.name}</span>
          </nav>

          <div className={styles.layout}>
            {/* Gallery */}
            <div className={styles.gallery}>
              <div className={styles.thumbs}>
                {images.length > 0 ? images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`${styles.thumb} ${i === activeImg ? styles.thumbActive : ''}`}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img.image_url} alt="" loading="lazy" />
                  </button>
                )) : <div className={styles.thumbPlaceholder} />}
              </div>
              <div className={styles.mainImg}>
                {images[activeImg]
                  ? <img src={images[activeImg].image_url} alt={product.name} />
                  : <div className={styles.imgPlaceholder}>{product.name}</div>}
              </div>
            </div>

            {/* Info */}
            <div className={styles.info}>
              <div className={styles.tags}>
                {product.category_name && <MetaTag tone="bronze">{product.category_name}</MetaTag>}
                {product.orisha_name && <><span className={styles.tagDot}>·</span><MetaTag tone="coral">{`Para ${product.orisha_name}`}</MetaTag></>}
                <span className={styles.tagDot}>·</span>
                <span className={styles.sku}>SKU · {product.sku}</span>
              </div>

              <h1 className={styles.title}>{product.name}</h1>
              <p className={styles.shortDesc}>{product.short_description}</p>

              <div className={styles.priceRow}>
                <Price amount={effectivePrice} size="xl" showCurrency />
                {product.installments_label && (
                  <span className={styles.installments}>· {product.installments_label}</span>
                )}
              </div>
              <div className={styles.priceFinePrint}>
                IVA INCLUIDO {product.free_shipping && '· ENVÍO GRATIS EN ESTE PEDIDO'}
              </div>

              {/* Variants */}
              {product.variants?.length > 0 && (
                <div className={styles.variants}>
                  <div className={styles.variantsHeader}>
                    <MetaTag>{product.variant_type_name || 'Variante'}</MetaTag>
                    {product.size_chart_url && (
                      <a href={product.size_chart_url} className={styles.sizeGuide}>
                        GUÍA DE TALLAS →
                      </a>
                    )}
                  </div>
                  <div className={styles.variantGrid}>
                    {product.variants.map((v) => {
                      const isActive = variant?.id === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVariant(v)}
                          className={`${styles.variantBtn} ${isActive ? styles.variantBtnActive : ''}`}
                        >
                          <div className={styles.variantLabel}>{v.label}</div>
                          {v.sub_label && <div className={styles.variantSub}>{v.sub_label}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className={styles.cta}>
                <div className={styles.qty}>
                  <button type="button" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                  <span>{qty}</span>
                  <button type="button" onClick={() => setQty(qty + 1)}>+</button>
                </div>
                <Button variant="primary" size="lg" onClick={handleAddToCart} disabled={!isAvailable} data-testid="add-to-cart">
                  {isAvailable ? 'Agregar a la bolsa' : 'Sin stock'}
                </Button>
                <button
                  type="button"
                  className={`${styles.wishBtn} ${inWishlist ? styles.wishBtnActive : ''}`}
                  aria-pressed={inWishlist}
                  aria-label={inWishlist ? 'Quitar de la lista de deseos' : 'Agregar a la lista de deseos'}
                  onClick={async () => {
                    const outerResult = await dispatch(toggleWishlist({ productId: product.id, variantId: variant?.id }));
                    const innerAction = outerResult?.payload;
                    const rejected = innerAction && (addToWishlist.rejected.match(innerAction)
                        || removeFromWishlist.rejected.match(innerAction));
                    // El 409 PRODUCT_ALREADY_IN_WISHLIST es benigno (carrera de
                    // hidratacion): el item ya estaba en la lista. No es error.
                    if (rejected && innerAction.payload?.code !== 'PRODUCT_ALREADY_IN_WISHLIST') {
                      toastError('No se pudo actualizar la lista de deseos');
                    }
                  }}
                >{inWishlist ? '♥' : '♡'}</button>
              </div>

              {/* Availability */}
              <div className={styles.availability}>
                <span className={`${styles.availDot} ${isAvailable ? styles.availDotOk : styles.availDotOut}`} />
                <span>
                  {isAvailable
                    ? <><strong>Disponible</strong> · {stock} {stock === 1 ? 'pieza' : 'piezas'} en bodega</>
                    : 'Agotado · avísame cuando vuelva'}
                </span>
              </div>

              {/* Trust strip */}
              <div className={styles.trust}>
                <div>
                  <MetaTag tone="bronze">Orisha</MetaTag>
                  <div>{product.orisha_name || '—'}</div>
                </div>
                <div>
                  <MetaTag tone="bronze">Uso ritual</MetaTag>
                  <div>{product.ritual_use || '—'}</div>
                </div>
                <div>
                  <MetaTag tone="bronze">Envío</MetaTag>
                  <div>2–4 días en México · DHL</div>
                </div>
                <div>
                  <MetaTag tone="bronze">Devolución</MetaTag>
                  <div>30 días en empaque sellado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Description */}
      <section className={styles.descSection}>
        <div className={styles.descContainer}>
          <div className={styles.descSidebar}>
            <MetaTag tone="bronze">Sobre esta pieza</MetaTag>
            <h2 className={styles.descSidebarTitle}>Información del producto</h2>
          </div>
          <div className={styles.descBlocks}>
            {product.description && (
              <DescBlock title="Descripción">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.description) }} />
              </DescBlock>
            )}
            {product.ritual_meaning && (
              <DescBlock title="Significado en la religión Yorùbà">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.ritual_meaning) }} />
              </DescBlock>
            )}
            {product.care_instructions && (
              <DescBlock title="Cuidado y conservación">
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.care_instructions) }} />
              </DescBlock>
            )}
            {product.specifications?.length > 0 && (
              <DescBlock title="Especificaciones">
                <div className={styles.specs}>
                  {product.specifications.map(([k, v]) => (
                    <div key={k} className={styles.specRow}>
                      <span className={styles.specKey}>{k}</span>
                      <span className={styles.specValue}>{v}</span>
                    </div>
                  ))}
                </div>
              </DescBlock>
            )}
          </div>
        </div>
      </section>

      {/* Reviews preview */}
      {reviewsTotal > 0 && (
        <section className={styles.reviewsSection} aria-labelledby="reviews-preview-title">
          <div className={styles.reviewsInner}>
            <header className={styles.reviewsHeader}>
              <div>
                <MetaTag tone="bronze">Opiniones de compradores</MetaTag>
                <h2 id="reviews-preview-title" className={styles.reviewsTitle}>
                  Reseñas del producto
                </h2>
                <div className={styles.reviewsSummary}>
                  <span className={styles.reviewsAvg}>{Number(reviewsAvg).toFixed(1)}</span>
                  <span
                    aria-label={`${Number(reviewsAvg).toFixed(1)} de 5`}
                    className={styles.reviewsStars}
                  >
                    {'★'.repeat(Math.round(Number(reviewsAvg)))}
                    {'☆'.repeat(5 - Math.round(Number(reviewsAvg)))}
                  </span>
                  <span className={styles.reviewsCount}>
                    {reviewsTotal} {reviewsTotal === 1 ? 'reseña' : 'reseñas'}
                  </span>
                </div>
              </div>
              <Link
                to={`/catalog/${product.id}/reviews`}
                className={styles.reviewsMore}
              >
                Ver todas las reseñas →
              </Link>
            </header>
            <ul className={styles.reviewsList}>
              {previewReviews.map((r) => (
                <li key={r.id}>
                  <ReviewItem review={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className={styles.related}>
          <div className={styles.relatedInner}>
            <header className={styles.relatedHeader}>
              <MetaTag tone="bronze">Acompañan esta pieza</MetaTag>
              <h2 className={styles.relatedTitle}>
                Otros objetos para {product.orisha_name || 'este uso ritual'}
              </h2>
            </header>
            <div className={styles.relatedGrid}>
              {related.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function DescBlock({ title, children }) {
  return (
    <div className={styles.descBlock}>
      <h3 className={styles.descBlockTitle}>{title}</h3>
      <div className={styles.descBlockBody}>{children}</div>
    </div>
  );
}
