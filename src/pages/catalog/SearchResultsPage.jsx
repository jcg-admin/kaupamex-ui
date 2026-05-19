/**
 * SearchResultsPage — UC-CAT-03 + UC-CAT-03-EXT.
 *
 * Pagina dedicada de resultados de busqueda en /search?q=<term>.
 * Diferencias frente a CatalogPage (UC-CAT-01):
 *  - el termino vive en `?q=` y se muestra editable arriba (POST-02),
 *  - la barra superior comunica «N resultados para «termino»»,
 *  - estado «sin resultados» con sugerencias accionables (Alt A),
 *  - validacion local de termino demasiado corto (Alt C).
 *
 * Combina UC-CAT-03-EXT (filtros avanzados sobre los resultados) via
 * `<CatalogFilters>` (categoria + precio).
 *
 * Stack: React Query (useSearch). No mutaciones.
 */
import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SearchBar from '@components/catalog/SearchBar';
import ProductCard from '@components/catalog/ProductCard';
import CatalogFilters from '@components/catalog/CatalogFilters';
import { useSearch, isQueryValid, normalizeQuery } from '@hooks/domain/useSearch';
import styles from './SearchResultsPage.module.scss';

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const rawQ          = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const priceMinParam = searchParams.get('price_min') || '';
  const priceMaxParam = searchParams.get('price_max') || '';

  const q = normalizeQuery(rawQ);
  const queryValid = isQueryValid(q);

  const { data, isLoading, isError } = useSearch(
    {
      q,
      category:  categoryParam || undefined,
      price_min: priceMinParam || undefined,
      price_max: priceMaxParam || undefined,
    },
    { enabled: queryValid },
  );

  const results = data?.results ?? [];
  const count   = data?.count ?? 0;

  const handleSearch = useCallback((next) => {
    const params = new URLSearchParams(searchParams);
    params.set('q', next);
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const handleFiltersChange = useCallback((patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Resultados de busqueda</h1>
        {queryValid && (
          <p className={styles.summary}>
            {count} resultado{count !== 1 ? 's' : ''} para{' '}
            <strong>«{q}»</strong>
          </p>
        )}
      </header>

      <div className={styles.searchWrapper}>
        <SearchBar
          onSearch={handleSearch}
          initialValue={rawQ}
          isSearching={isLoading}
        />
      </div>

      {!queryValid && (
        <div className={styles.shortQuery} role="status">
          <p>
            Escribe al menos 2 caracteres para empezar la busqueda.
          </p>
        </div>
      )}

      {queryValid && (
        <div className={styles.layout}>
          <CatalogFilters
            category={categoryParam}
            priceMin={priceMinParam}
            priceMax={priceMaxParam}
            onChange={handleFiltersChange}
          />

          <div className={styles.results}>
            {isLoading && (
              <div className={styles.loading} aria-live="polite">
                <div className={styles.spinner} />
                <p>Buscando...</p>
              </div>
            )}

            {isError && !isLoading && (
              <div className={styles.error} role="alert">
                No se pudo completar la busqueda. Intenta de nuevo.
              </div>
            )}

            {!isLoading && !isError && results.length === 0 && (
              <div className={styles.empty}>
                <p>
                  No encontramos productos para <strong>«{q}»</strong>.
                </p>
                <ul className={styles.suggestions}>
                  <li>Revisa la ortografia del termino.</li>
                  <li>Usa terminos mas generales o sinonimos.</li>
                  <li>
                    <Link to="/catalog">Explora el catalogo completo</Link>.
                  </li>
                  <li>
                    Si buscas un articulo Yoruba especifico,{' '}
                    <Link to="/contact">contactanos</Link>.
                  </li>
                </ul>
              </div>
            )}

            {!isLoading && results.length > 0 && (
              <section aria-label="Resultados">
                <div className={styles.grid}>
                  {results.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
