/**
 * RelatedProductsSection — UC-CAT-07.
 *
 * Seccion embebida en la ficha de producto que muestra hasta N
 * productos relacionados (misma categoria, productos activos con stock).
 * La seccion se oculta silenciosamente cuando no hay resultados o el
 * query falla (EX-01 / EX-02 de UC-CAT-07).
 *
 * El fallback `fallback='recent'` o `fallback='best_sellers'` activa el
 * titulo «Tambien te puede interesar» en lugar de «Productos relacionados».
 */
import ProductCard from './ProductCard';
import { useRelatedProducts } from '@hooks/domain/useRelatedProducts';
import styles from './RelatedProductsSection.module.scss';

export default function RelatedProductsSection({ slug }) {
  const { data, isLoading, isError } = useRelatedProducts(slug);

  // EX-01/EX-02: ocultar silenciosamente ante error o resultados vacios.
  if (isError) return null;

  if (isLoading) {
    return (
      <section className={styles.section} aria-busy="true">
        <h2 className={styles.title}>Productos relacionados</h2>
        <p className={styles.loading}>Buscando productos relacionados...</p>
      </section>
    );
  }

  const items = data?.results ?? [];
  if (items.length === 0) return null;

  const title = data?.fallback && data.fallback !== 'category'
    ? 'Tambien te puede interesar'
    : 'Productos relacionados';

  return (
    <section className={styles.section} aria-label={title}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {items.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
