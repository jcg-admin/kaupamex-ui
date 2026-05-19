/**
 * CatalogPage — PracticaYoruba
 * UC-CAT-01: listado de productos
 * UC-CAT-03 + UC-SRCH-01: búsqueda FULLTEXT (search redirige a /search)
 * UC-CAT-04: filtrar por categoria via ?category=<slug>
 * UC-CAT-05: filtrar por precio via ?price_min= / ?price_max=
 */
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchProducts,
  searchProducts,
  clearSearch,
  setPage,
} from '@redux/slices/catalogSlice';
import SearchBar   from '@components/catalog/SearchBar';
import ProductCard from '@components/catalog/ProductCard';
import CatalogFilters from '@components/catalog/CatalogFilters';
import styles      from './CatalogPage.module.scss';

export default function CatalogPage() {
  const dispatch     = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    products, searchResults,
    searchQuery, isLoading, isSearching,
    error, searchError,
    pagination,
  } = useSelector((s) => s.catalog);

  const [mode, setMode] = useState('listing'); // 'listing' | 'search'

  // Sincronizar params de URL con el estado
  const qParam        = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const priceMinParam = searchParams.get('price_min') || '';
  const priceMaxParam = searchParams.get('price_max') || '';

  useEffect(() => {
    if (qParam) {
      setMode('search');
      dispatch(searchProducts({
        q: qParam,
        category: categoryParam || undefined,
        price_min: priceMinParam || undefined,
        price_max: priceMaxParam || undefined,
      }));
    } else {
      setMode('listing');
      dispatch(fetchProducts({
        category:  categoryParam || undefined,
        price_min: priceMinParam || undefined,
        price_max: priceMaxParam || undefined,
      }));
    }
  }, [dispatch, qParam, categoryParam, priceMinParam, priceMaxParam]);

  const handleSearch = useCallback((q) => {
    const next = new URLSearchParams(searchParams);
    next.set('q', q);
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const handleClearSearch = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
    dispatch(clearSearch());
    setMode('listing');
  }, [dispatch, searchParams, setSearchParams]);

  const handleFiltersChange = useCallback((patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next);
  }, [searchParams, setSearchParams]);

  const displayItems = mode === 'search' ? searchResults : products;
  const loading      = mode === 'search' ? isSearching : isLoading;
  const apiError     = mode === 'search' ? searchError  : error;

  return (
    <main className={styles.page}>
      {/* Cabecera */}
      <header className={styles.header}>
        <h1 className={styles.title}>
          {mode === 'search' ? 'Resultados de búsqueda' : 'Catálogo Yoruba'}
        </h1>
        {mode === 'search' && searchQuery && (
          <p className={styles.searchInfo}>
            {pagination.count} resultado{pagination.count !== 1 ? 's' : ''} para{' '}
            <strong>«{searchQuery}»</strong>
          </p>
        )}
      </header>

      {/* Barra de búsqueda */}
      <div className={styles.searchWrapper}>
        <SearchBar
          onSearch={handleSearch}
          initialValue={qParam}
          isSearching={isSearching}
        />
        {mode === 'search' && (
          <button
            type="button"
            className={styles.clearSearch}
            onClick={handleClearSearch}
          >
            Ver catálogo completo
          </button>
        )}
      </div>

      {/* UC-CAT-04 + UC-CAT-05 — Filtros laterales (categoria + precio) */}
      <div className={styles.layoutWithFilters}>
        <CatalogFilters
          category={categoryParam}
          priceMin={priceMinParam}
          priceMax={priceMaxParam}
          onChange={handleFiltersChange}
        />
        <div className={styles.results}>

      {/* Estado de carga */}
      {loading && (
        <div className={styles.loading} aria-live="polite" aria-label="Cargando productos">
          <div className={styles.spinner} />
          <p>{mode === 'search' ? 'Buscando...' : 'Cargando catálogo...'}</p>
        </div>
      )}

      {/* Error */}
      {apiError && !loading && (
        <div className={styles.error} role="alert">
          <p>No se pudieron cargar los productos. Por favor intenta de nuevo.</p>
        </div>
      )}

      {/* Sin resultados */}
      {!loading && !apiError && displayItems.length === 0 && (
        <div className={styles.empty}>
          {mode === 'search' ? (
            <>
              <p>No encontramos productos para <strong>«{searchQuery}»</strong>.</p>
              <p className={styles.emptySub}>
                Prueba con otro término o{' '}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={handleClearSearch}
                >
                  explora el catálogo completo
                </button>.
              </p>
            </>
          ) : (
            <p>El catálogo no tiene productos disponibles por el momento.</p>
          )}
        </div>
      )}

      {/* Cuadrícula de productos */}
      {!loading && displayItems.length > 0 && (
        <section aria-label="Productos">
          <div className={styles.grid}>
            {displayItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
        </div>
      </div>
    </main>
  );
}
