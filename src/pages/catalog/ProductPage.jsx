/**
 * ProductPage — PracticaYoruba
 * UC-CAT-02: Ficha completa de un producto.
 */
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProduct,
  clearCurrentProduct,
} from '@redux/slices/catalogSlice';
import { clearSelectedVariant } from '@redux/slices/yorubaVariantsSlice';
import VariantSelector from '@components/catalog/VariantSelector';
import AddToWishlistButton from '@components/wishlist/AddToWishlistButton';
import RelatedProductsSection from '@components/catalog/RelatedProductsSection';
import useAddProductWithVariant from '@hooks/useAddProductWithVariant';
import styles from './ProductPage.module.scss';

export default function ProductPage() {
  const { slug }   = useParams();
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const { currentProduct: product, isLoading, error } = useSelector((s) => s.catalog);
  const selectedVariantId = useSelector(
    (s) => s.yorubaVariants?.selectedVariantId ?? null,
  );

  const { addProduct } = useAddProductWithVariant();
  const [cartFeedback, setCartFeedback] = useState(null);

  useEffect(() => {
    dispatch(fetchProduct(slug));
    return () => {
      dispatch(clearCurrentProduct());
      dispatch(clearSelectedVariant());
    };
  }, [dispatch, slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    const outcome = await addProduct(product, 1);
    if (outcome.ok) {
      setCartFeedback({ type: 'success', message: 'Producto agregado al carrito.' });
    } else if (outcome.error === 'VARIANTE_REQUERIDA') {
      setCartFeedback({ type: 'error', message: 'Selecciona una variante antes de agregar al carrito.' });
    } else if (outcome.error === 'VARIANTE_SIN_STOCK') {
      setCartFeedback({ type: 'error', message: 'La variante seleccionada no tiene stock disponible.' });
    } else {
      setCartFeedback({ type: 'error', message: 'No se pudo agregar al carrito.' });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading} aria-live="polite">
        <div className={styles.spinner} />
        <p>Cargando producto...</p>
      </div>
    );
  }

  if (error || (!isLoading && !product)) {
    return (
      <div className={styles.notFound}>
        <h1>Producto no disponible</h1>
        <p>Este producto no existe o ya no está publicado.</p>
        <Link to="/catalog" className={styles.backLink}>
          Ver catálogo completo
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const {
    name, sku, description, short_description,
    base_price, price_with_tax,
    availability, stock,
    category, images, discount,
    is_featured,
    variants,
  } = product;

  const hasVariants = Array.isArray(variants) && variants.length > 0;
  const selectedVariant = hasVariants
    ? variants.find((v) => v.id === selectedVariantId) ?? null
    : null;

  // UC-CHT-01: el precio mostrado refleja la variante seleccionada. El
  // contrato real (apps/chartsize commit 5e72899) expone price_with_tax;
  // mantenemos fallback a effective_price / price para mocks heredados.
  const displayPrice = (
    selectedVariant?.price_with_tax
    ?? selectedVariant?.effective_price
    ?? selectedVariant?.price
    ?? price_with_tax
  );
  const isAvailable = hasVariants
    ? variants.some((v) => v.stock > 0)
    : availability === 'IN_STOCK';

  return (
    <main className={styles.page}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb} aria-label="Ruta de navegación">
        <Link to="/catalog">Catálogo</Link>
        {category && (
          <>
            <span aria-hidden="true"> / </span>
            <Link to={`/catalog?category=${category.id}`}>{category.name}</Link>
          </>
        )}
        <span aria-hidden="true"> / </span>
        <span aria-current="page">{name}</span>
      </nav>

      <div className={styles.layout}>
        {/* Galería */}
        <section aria-label="Imágenes del producto">
          <div className={styles.mainImage}>
            {images && images.length > 0 ? (
              <img src={images[0].url} alt={images[0].alt || name} />
            ) : (
              <div className={styles.imagePlaceholder}>
                <span className={styles.skuLabel}>{sku}</span>
              </div>
            )}
          </div>
        </section>

        {/* Información */}
        <section className={styles.info}>
          {is_featured && (
            <span className={styles.featuredBadge}>Destacado</span>
          )}
          {category && (
            <Link
              to={`/catalog?category=${category.id}`}
              className={styles.categoryLink}
            >
              {category.name}
            </Link>
          )}

          <h1 className={styles.name}>{name}</h1>
          <p className={styles.skuText}>SKU: {sku}</p>

          {short_description && (
            <p className={styles.shortDesc}>{short_description}</p>
          )}

          {/* Precios */}
          <div className={styles.pricing}>
            {discount ? (
              <>
                <span className={styles.originalPrice}>
                  ${Number(base_price).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className={styles.discountedPrice}>
                  ${Number(discount.final_price).toLocaleString('es-MX', {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className={styles.discountBadge}>
                  -{discount.pct}%
                </span>
              </>
            ) : (
              <span className={styles.price}>
                ${Number(displayPrice).toLocaleString('es-MX', {
                  minimumFractionDigits: 2,
                })}
              </span>
            )}
            <span className={styles.taxLabel}>precio con IVA incluido</span>
          </div>

          {/* Disponibilidad */}
          <div className={styles.availability}>
            {isAvailable ? (
              <span className={styles.inStock}>
                Disponible — {stock} {stock === 1 ? 'unidad' : 'unidades'}
              </span>
            ) : (
              <span className={styles.outOfStock}>Sin stock</span>
            )}
          </div>

          {/* UC-CHT-01: selector de variantes Yoruba (Tamano, Presentacion, Material) */}
          {hasVariants && <VariantSelector variants={variants} />}

          {/* CTA */}
          <button
            type="button"
            className={styles.addToCart}
            disabled={!isAvailable || (hasVariants && !selectedVariant)}
            aria-disabled={!isAvailable || (hasVariants && !selectedVariant)}
            onClick={handleAddToCart}
          >
            {isAvailable
              ? hasVariants && !selectedVariant
                ? 'Selecciona una variante'
                : 'Agregar al carrito'
              : 'Sin disponibilidad'}
          </button>

          {/* UC-WISH-01: agregar a la lista de deseos */}
          <AddToWishlistButton
            productId={product.id}
            variantId={selectedVariantId ?? null}
          />

          {/* UC-CHT-02: feedback al intentar agregar al carrito */}
          {cartFeedback && (
            <p
              role={cartFeedback.type === 'error' ? 'alert' : 'status'}
              className={
                cartFeedback.type === 'error' ? styles.cartError : styles.cartSuccess
              }
            >
              {cartFeedback.message}
            </p>
          )}

          {/* Descripción completa */}
          {description && (
            <div className={styles.description}>
              <h2 className={styles.descTitle}>Descripción</h2>
              <p>{description}</p>
            </div>
          )}
        </section>
      </div>

      {/* UC-CAT-07 — Productos relacionados (se oculta solo si vacio/error) */}
      <RelatedProductsSection slug={slug} />
    </main>
  );
}
