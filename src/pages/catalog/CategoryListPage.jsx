/**
 * CategoryListPage — UC-CAT-08.
 *
 * Listado publico del arbol jerarquico de categorias con conteos
 * de productos activos. Cada nodo es un enlace a UC-CAT-01 (catalogo
 * filtrado por categoria, via `/catalog?category=<slug>`).
 *
 * Stack: React Query (useCategories) sobre GET /api/v1/categories/.
 * No hay mutaciones — el admin las gestiona en UC-CAT-06.
 */
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useCategories } from '@hooks/domain/useCategories';
import styles from './CategoryListPage.module.scss';

function pluralProductos(n) {
  return `${n} producto${n === 1 ? '' : 's'}`;
}

function CategoryNode({ node }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <li className={styles.node}>
      <div className={styles.nodeRow}>
        {hasChildren ? (
          <button
            type="button"
            className={styles.toggle}
            onClick={toggle}
            aria-expanded={expanded}
            aria-label={`${expanded ? 'Colapsar' : 'Expandir'} ${node.name}`}
          >
            {expanded ? '−' : '+'}
          </button>
        ) : (
          <span className={styles.toggleSpacer} aria-hidden="true" />
        )}

        <Link
          to={`/catalog?category=${encodeURIComponent(node.slug)}`}
          className={styles.nodeLink}
          aria-label={`Ver productos de ${node.name}`}
        >
          <span className={styles.nodeName}>{node.name}</span>
          <span className={styles.count}>
            {pluralProductos(node.product_count ?? 0)}
          </span>
        </Link>
      </div>

      {hasChildren && expanded && (
        <ul className={styles.children}>
          {node.children.map((child) => (
            <CategoryNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CategoryListPage() {
  const { data, isLoading, isError } = useCategories();
  const tree = data?.results ?? [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Categorias</h1>
        <p className={styles.subtitle}>
          Explora el catalogo Yoruba por familias de productos.
        </p>
      </header>

      {isLoading && (
        <div className={styles.loading} aria-live="polite">
          <div className={styles.spinner} />
          <p>Cargando categorias...</p>
        </div>
      )}

      {isError && !isLoading && (
        <div className={styles.error} role="alert">
          No se pudo cargar el arbol de categorias. Reintenta mas tarde.
        </div>
      )}

      {!isLoading && !isError && tree.length === 0 && (
        <p className={styles.empty}>
          No hay categorias disponibles por el momento.
        </p>
      )}

      {!isLoading && tree.length > 0 && (
        <ul className={styles.tree} aria-label="Arbol de categorias">
          {tree.map((root) => (
            <CategoryNode key={root.id} node={root} />
          ))}
        </ul>
      )}
    </main>
  );
}
