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
  fetchProducts, searchProducts, clearSearch, setPage, setFilter, clearFilters,
} from '@redux/slices/catalogSlice';
import SearchBar from '@components/catalog/SearchBar';
import ProductCard from '@components/catalog/ProductCard';
import { MetaTag, Button, EmptyState } from '@components/common/primitives';
import styles from './CatalogPage.module.scss';

const ORISHAS = ['Yemayá','Shangó','Oshún','Obatalá','Oyá','Eleguá','Oggún','Babalú-Ayé'];
const TYPES   = ['Eleke','Otán','Sopera','Herramienta','Bandera','Libro'];

// Mapping from UI label to API ordering param
const SORT_OPTIONS = [
  { label: 'Recomendados',    value: '-created_at' },
  { label: 'Precio: menor',   value: 'precio-asc'  },
  { label: 'Precio: mayor',   value: 'precio-desc' },
  { label: 'Recién llegados', value: 'novedad'      },
];

export default function CatalogPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    products = [], searchResults = [],
    searchQuery, isLoading, isSearching,
    error, searchError, pagination = {}, filters = {},
  } = useSelector((s) => s.catalog || {});

  const qParam  = searchParams.get('q')   || '';
  const catParam = searchParams.get('cat') || '';
  const mode = qParam ? 'search' : 'listing';

  // Re-fetch whenever listing filters or page change (but not in search mode)
  useEffect(() => {
    if (qParam) dispatch(searchProducts({ q: qParam }));
    else dispatch(fetchProducts({
      category: catParam || filters.category || undefined,
      price_min: filters.priceMin || undefined,
      price_max: filters.priceMax || undefined,
      in_stock: filters.inStock || undefined,
      ordering: filters.ordering || undefined,
      page: pagination.page || 1,
    }));
  }, [dispatch, qParam, catParam, filters.category, filters.priceMin, filters.priceMax,
      filters.inStock, filters.ordering, pagination.page]);

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
          <FilterSidebar dispatch={dispatch} />

          <section className={styles.results}>
            <Toolbar
              count={displayItems.length}
              total={pagination.count}
              ordering={filters.ordering || '-created_at'}
              onOrdering={(val) => dispatch(setFilter({ ordering: val }))}
            />

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

            {pagination.totalPages > 1 && (
              <Pagination
                current={pagination.page}
                total={pagination.totalPages}
                onPage={(p) => dispatch(setPage(p))}
              />
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function FilterSidebar({ dispatch }) {
  const handleClearFilters = () => dispatch(clearFilters());
  return (
    <aside className={styles.sidebar}>
      <FilterGroup title="Òrìsà" items={ORISHAS} dispatch={dispatch} filterKey="category" />
      <FilterGroup title="Tipo de pieza" items={TYPES} dispatch={dispatch} filterKey="category" />
      <FilterGroup title="Rango de precio">
        <PriceSlider dispatch={dispatch} />
      </FilterGroup>
      <FilterGroup title="Disponibilidad">
        <Check
          label="Disponible inmediato"
          onChange={(checked) => dispatch(setFilter({ inStock: checked }))}
        />
      </FilterGroup>
      <Button variant="secondary" block onClick={handleClearFilters}>Limpiar filtros</Button>
    </aside>
  );
}
function FilterGroup({ title, items, children, dispatch, filterKey }) {
  return (
    <div className={styles.filterGroup}>
      <h4 className={styles.filterTitle}>{title}</h4>
      {items?.map((i) => (
        <Check
          key={i}
          label={i}
          onChange={(checked) => {
            if (dispatch && filterKey) {
              dispatch(setFilter({ [filterKey]: checked ? i.toLowerCase() : null }));
            }
          }}
        />
      ))}
      {children}
    </div>
  );
}
function Check({ label, onChange }) {
  const [checked, setChecked] = useState(false);
  const handleChange = (e) => {
    setChecked(e.target.checked);
    if (onChange) onChange(e.target.checked);
  };
  return (
    <label className={styles.check}>
      <input type="checkbox" checked={checked} onChange={handleChange} />
      <span className={styles.checkbox} />
      <span>{label}</span>
    </label>
  );
}
function PriceSlider({ dispatch }) {
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const apply = () => {
    if (dispatch) dispatch(setFilter({
      priceMin: priceMin ? Number(priceMin) : null,
      priceMax: priceMax ? Number(priceMax) : null,
    }));
  };
  return (
    <div className={styles.slider}>
      <div className={styles.sliderInputs}>
        <input
          type="number"
          placeholder="Mín MXN"
          value={priceMin}
          onChange={(e) => setPriceMin(e.target.value)}
          onBlur={apply}
          className={styles.sliderInput}
        />
        <input
          type="number"
          placeholder="Máx MXN"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          onBlur={apply}
          className={styles.sliderInput}
        />
      </div>
    </div>
  );
}

function Toolbar({ count, total, ordering, onOrdering }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarCount}>
        Mostrando <strong>{count}</strong> de {total || count} piezas
      </div>
      <div className={styles.toolbarRight}>
        <label className={styles.sort}>
          <span>Ordenar:</span>
          <select value={ordering} onChange={(e) => onOrdering(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
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
            key={p}
            className={p === current ? styles.pageActive : ''}
            onClick={() => onPage(p)}
          >{p}</button>
        ) : <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>{p}</span>
      )}
      <button disabled={current === total} onClick={() => onPage(current + 1)}>Siguiente →</button>
    </div>
  );
}
