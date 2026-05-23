/**
 * CatalogPage — Práctica Yorùbà
 * Re-skin del catálogo con sidebar de filtros + grid editorial.
 * Mantiene la lógica original (Redux + búsqueda fulltext).
 *
 * Endpoints:
 *   GET /catalogue/?cat=...&orisha=...&page=...
 *   GET /catalogue/search/?q=...
 *   GET /catalogue/categories/
 */

import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchProducts, searchProducts, clearSearch, setPage,
} from '@redux/slices/catalogSlice';
import SearchBar from '@components/catalog/SearchBar';
import ProductCard from '@components/catalog/ProductCard';
import { MetaTag, Button, EmptyState } from '@components/common/primitives';
import styles from './CatalogPage.module.scss';

const ORISHAS = ['Yemayá','Shangó','Oshún','Obatalá','Oyá','Eleguá','Oggún','Babalú-Ayé'];
const TYPES   = ['Eleke','Otán','Sopera','Herramienta','Bandera','Libro'];

export default function CatalogPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products = [], searchResults = [],
    searchQuery, isLoading, isSearching,
    error, searchError, pagination = {},
  } = useSelector((s) => s.catalog || {});

  const qParam = searchParams.get('q') || '';
  const mode = qParam ? 'search' : 'listing';

  useEffect(() => {
    if (qParam) dispatch(searchProducts({ q: qParam }));
    else dispatch(fetchProducts());
  }, [dispatch, qParam]);

  const handleSearch = useCallback((q) => setSearchParams({ q }), [setSearchParams]);
  const handleClearSearch = useCallback(() => {
    setSearchParams({});
    dispatch(clearSearch());
  }, [dispatch, setSearchParams]);

  const displayItems = mode === 'search' ? searchResults : products;
  const loading      = mode === 'search' ? isSearching : isLoading;
  const apiError     = mode === 'search' ? searchError : error;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <nav className={styles.breadcrumb}>
            <a href="/">Inicio</a><span>/</span>
            <span className={styles.bcCurrent}>{mode === 'search' ? 'Búsqueda' : 'Catálogo'}</span>
          </nav>
          <div className={styles.heroGrid}>
            <div>
              <MetaTag tone="bronze">
                Catálogo · {pagination.count || displayItems.length} piezas
              </MetaTag>
              <h1 className={styles.title}>
                {mode === 'search'
                  ? <>Resultados de búsqueda</>
                  : <>Objetos rituales <em>Yorùbà</em></>}
              </h1>
              {mode === 'search' && searchQuery && (
                <p className={styles.lead}>
                  {pagination.count} resultado{pagination.count !== 1 ? 's' : ''} para{' '}
                  <strong>«{searchQuery}»</strong>{' '}
                  · <button onClick={handleClearSearch} className={styles.clearLink}>Limpiar búsqueda</button>
                </p>
              )}
              {mode === 'listing' && (
                <p className={styles.lead}>
                  Todos los objetos del catálogo organizados por òrìsà y por uso ritual.
                </p>
              )}
            </div>
            <div className={styles.heroSearch}>
              <SearchBar onSearch={handleSearch} initialValue={qParam} isSearching={isSearching} />
            </div>
          </div>
        </div>
      </header>

      <div className={styles.container}>
        <div className={styles.layout}>
          <FilterSidebar />

          <section className={styles.results}>
            <Toolbar count={displayItems.length} total={pagination.count} />

            {loading && (
              <div className={styles.loading} aria-live="polite">
                <div className={styles.spinner} />
                <p>Cargando catálogo…</p>
              </div>
            )}

            {apiError && !loading && (
              <div className={styles.errorBox} role="alert">
                No se pudieron cargar los productos. Inténtalo de nuevo.
              </div>
            )}

            {!loading && !apiError && displayItems.length === 0 && (
              <EmptyState
                icon="⌕"
                title={mode === 'search' ? `No encontramos "${searchQuery}"` : 'Catálogo vacío'}
                description="Prueba escribiendo el nombre del òrìsà, del tipo de objeto o del uso ritual."
              >
                <Button variant="primary" onClick={handleClearSearch}>Ver catálogo completo</Button>
              </EmptyState>
            )}

            {!loading && displayItems.length > 0 && (
              <div className={styles.grid}>
                {displayItems.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {pagination.total_pages > 1 && (
              <Pagination
                current={pagination.page}
                total={pagination.total_pages}
                onPage={(p) => dispatch(setPage(p))}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function FilterSidebar() {
  return (
    <aside className={styles.sidebar}>
      <FilterGroup title="Òrìsà" items={ORISHAS} />
      <FilterGroup title="Tipo de pieza" items={TYPES} />
      <FilterGroup title="Rango de precio">
        <PriceSlider />
      </FilterGroup>
      <FilterGroup title="Disponibilidad">
        <Check label="Disponible inmediato" checked />
        <Check label="Sobre pedido" />
        <Check label="En oferta" />
      </FilterGroup>
      <Button variant="secondary" block>Limpiar filtros</Button>
    </aside>
  );
}
function FilterGroup({ title, items, children }) {
  return (
    <div className={styles.filterGroup}>
      <h4 className={styles.filterTitle}>{title}</h4>
      {items?.map((i) => <Check key={i} label={i} />)}
      {children}
    </div>
  );
}
function Check({ label, checked = false }) {
  return (
    <label className={styles.check}>
      <input type="checkbox" defaultChecked={checked} />
      <span className={styles.checkbox} />
      <span>{label}</span>
    </label>
  );
}
function PriceSlider() {
  return (
    <div className={styles.slider}>
      <div className={styles.sliderTrack}>
        <div className={styles.sliderFill} />
        <div className={styles.sliderHandle} style={{ left: '15%' }} />
        <div className={styles.sliderHandle} style={{ left: '60%' }} />
      </div>
      <div className={styles.sliderLabels}>
        <span>$580 MXN</span><span>$8,200 MXN</span>
      </div>
    </div>
  );
}

function Toolbar({ count, total }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarCount}>
        Mostrando <strong>{count}</strong> de {total || count} piezas
      </div>
      <div className={styles.toolbarRight}>
        <label className={styles.sort}>
          <span>Ordenar:</span>
          <select>
            <option>Recomendados</option>
            <option>Precio: menor</option>
            <option>Precio: mayor</option>
            <option>Recién llegados</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function Pagination({ current, total, onPage }) {
  const pages = [];
  for (let p = 1; p <= total; p++) {
    if (p <= 3 || p === total || Math.abs(p - current) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }
  return (
    <div className={styles.pagination}>
      <button disabled={current === 1} onClick={() => onPage(current - 1)}>← Anterior</button>
      {pages.map((p, i) =>
        typeof p === 'number' ? (
          <button
            key={i}
            className={p === current ? styles.pageActive : ''}
            onClick={() => onPage(p)}
          >{p}</button>
        ) : <span key={i} className={styles.pageEllipsis}>{p}</span>
      )}
      <button disabled={current === total} onClick={() => onPage(current + 1)}>Siguiente →</button>
    </div>
  );
}
