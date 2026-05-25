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
import { fetchProduct } from '@redux/slices/catalogSlice';
import { addCartItem } from '@redux/slices/cartSlice';
import { toggleWishlist } from '@redux/slices/wishlistSlice';
import ProductCard from '@components/catalog/ProductCard';
import { MetaTag, Price, Button } from '@components/common/primitives';
import styles from './ProductPage.module.scss';

export default function ProductPage() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const product = useSelector((s) => s.catalog?.currentProduct);
  const isLoading = useSelector((s) => s.catalog?.isLoading);

  const [variant, setVariant] = useState(null);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

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

  const handleAddToCart = () => {
    dispatch(addCartItem({
      product_id: product.id,
      variant_id: variant?.id,
      quantity: qty,
    }));
    navigate('/carrito');
  };

  return (
    <main className={styles.page}>
      <section className={styles.main}>
        <div className={styles.container}>
          <nav className={styles.breadcrumb}>
            <Link to="/">Inicio</Link><span>/</span>
            <Link to="/catalogo">Catálogo</Link><span>/</span>
            {product.category_name && (<><Link to={`/catalogo?cat=${product.category_slug}`}>{product.category_name}</Link><span>/</span></>)}
            {product.orisha_name && (<><Link to={`/catalogo?orisha=${product.orisha_slug}`}>{product.orisha_name}</Link><span>/</span></>)}
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
                    <img src={img.url} alt="" />
                  </button>
                )) : <div className={styles.thumbPlaceholder} />}
              </div>
              <div className={styles.mainImg}>
                {images[activeImg]
                  ? <img src={images[activeImg].url} alt={product.name} />
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
                <Button variant="primary" size="lg" onClick={handleAddToCart} disabled={!isAvailable}>
                  {isAvailable ? 'Agregar a la bolsa' : 'Sin stock'}
                </Button>
                <button
                  type="button"
                  className={styles.wishBtn}
                  onClick={() => dispatch(toggleWishlist({ productId: product.id, variantId: variant?.id }))}
                >♡</button>
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
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              </DescBlock>
            )}
            {product.ritual_meaning && (
              <DescBlock title="Significado en la religión Yorùbà">
                <div dangerouslySetInnerHTML={{ __html: product.ritual_meaning }} />
              </DescBlock>
            )}
            {product.care_instructions && (
              <DescBlock title="Cuidado y conservación">
                <div dangerouslySetInnerHTML={{ __html: product.care_instructions }} />
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
