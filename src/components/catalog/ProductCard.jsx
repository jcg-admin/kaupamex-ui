/**
 * ProductCard — PracticaYoruba
 * Tarjeta de producto para el catálogo y resultados de búsqueda.
 * Muestra base_price + precio con IVA, disponibilidad y categoría.
 */
import { Link } from 'react-router-dom';
import styles from './ProductCard.module.scss';

export default function ProductCard({ product }) {
  if (!product) return null;

  const {
    name, slug, sku,
    base_price, price_with_tax,
    category_name,
    stock, is_featured,
    highlighted_name,
  } = product;

  const isAvailable = stock > 0;

  return (
    <Link to={`/catalog/${slug}`} className={styles.card}>
      {is_featured && <span className={styles.badge}>Destacado</span>}

      <div className={styles.imageArea}>
        <div className={styles.imagePlaceholder}>
          <span className={styles.sku}>{sku}</span>
        </div>
      </div>

      <div className={styles.info}>
        {category_name && (
          <span className={styles.category}>{category_name}</span>
        )}

        <h3
          className={styles.name}
          dangerouslySetInnerHTML={{ __html: highlighted_name || name }}
        />

        <div className={styles.pricing}>
          <span className={styles.price}>
            ${Number(price_with_tax).toLocaleString('es-MX', {
              minimumFractionDigits: 2, maximumFractionDigits: 2,
            })}
          </span>
          <span className={styles.priceLabel}>con IVA</span>
        </div>

        <div className={styles.footer}>
          <span className={isAvailable ? styles.inStock : styles.outOfStock}>
            {isAvailable ? 'Disponible' : 'Sin stock'}
          </span>
        </div>
      </div>
    </Link>
  );
}
