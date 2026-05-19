/**
 * HomePage — PracticaYoruba
 * Landing publica de la tienda (UC-CAT-01 entrada).
 *
 * Estructura:
 *   - Hero con CTA al catalogo y al registro
 *   - Categorias destacadas (links a /catalog?cat=...)
 *   - Productos recientes (primeros 8 del catalogo)
 *   - CTA secundario para newsletter y contacto
 *
 * Renderiza sin requerir autenticacion.
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '@redux/slices/catalogSlice';
import ProductCard from '@components/catalog/ProductCard';
import styles from './HomePage.module.scss';

const FEATURED_CATEGORIES = [
  { slug: 'collares', label: 'Collares' },
  { slug: 'pulseras', label: 'Pulseras' },
  { slug: 'ofrendas', label: 'Ofrendas' },
];

export default function HomePage() {
  const dispatch = useDispatch();
  const { products, isLoading } = useSelector((s) => s.catalog);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const featured = Array.isArray(products) ? products.slice(0, 8) : [];

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <h1 id="hero-title" className={styles.heroTitle}>
            Practica Yoruba
          </h1>
          <p className={styles.heroSubtitle}>
            Articulos religiosos y ceremoniales hechos con tradicion.
          </p>
          <div className={styles.heroActions}>
            <Link to="/catalog" className={styles.primaryBtn}>
              Ver catalogo
            </Link>
            <Link to="/auth/register" className={styles.secondaryBtn}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Categorias destacadas */}
      <section className={styles.categories} aria-labelledby="cats-title">
        <h2 id="cats-title" className={styles.sectionTitle}>Categorias</h2>
        <ul className={styles.categoryList}>
          {FEATURED_CATEGORIES.map(({ slug, label }) => (
            <li key={slug}>
              <Link to={`/catalog?cat=${slug}`} className={styles.categoryLink}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Productos destacados */}
      <section className={styles.featured} aria-labelledby="featured-title">
        <h2 id="featured-title" className={styles.sectionTitle}>
          Productos recientes
        </h2>
        {isLoading && featured.length === 0 ? (
          <p>Cargando productos…</p>
        ) : featured.length === 0 ? (
          <p>Aun no hay productos publicados.</p>
        ) : (
          <div className={styles.grid} data-testid="home-featured-grid">
            {featured.map((p) => (
              <ProductCard key={p.id ?? p.slug} product={p} />
            ))}
          </div>
        )}
        <p className={styles.featuredFooter}>
          <Link to="/catalog" className={styles.linkInline}>
            Ver todos los productos →
          </Link>
        </p>
      </section>

      {/* CTA secundario */}
      <section className={styles.ctaRow} aria-label="Acciones secundarias">
        <Link to="/newsletter" className={styles.ctaCard}>
          <h3>Suscribete al newsletter</h3>
          <p>Recibe promociones y nuevos lanzamientos.</p>
        </Link>
        <Link to="/contact" className={styles.ctaCard}>
          <h3>Contactanos</h3>
          <p>¿Tienes dudas? Escribenos.</p>
        </Link>
      </section>
    </div>
  );
}
