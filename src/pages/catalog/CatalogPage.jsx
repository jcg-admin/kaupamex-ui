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

import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import {
  fetchProducts, fetchCategories, searchProducts, clearSearch, setPage, setFilter, clearFilters,
} from '@redux/slices/catalogSlice';
import SearchBar from '@components/catalog/SearchBar';
import ProductCard from '@components/catalog/ProductCard';
import { MetaTag, Button, EmptyState } from '@components/common/primitives';
import { RangeSlider, Chip } from '@components/common';
import styles from './CatalogPage.module.scss';

const PRICE_CEILING = 10000;
const fmtMoney = (v) => `$${Number(v).toLocaleString('es-MX')}`;

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
    error, searchError, pagination = {}, filters = {}, categories = [],
  } = useSelector((s) => s.catalog || {});

  const qParam  = searchParams.get('q')   || '';
  const catParam = searchParams.get('cat') || '';
  const mode = qParam ? 'search' : 'listing';

  // Al entrar al catalogo o cambiar los filtros por URL (?orisha, ?cat, ?q,
  // ?page), posicionar la vista donde EMPIEZAN los productos, no en el hero.
  // ScrollToTop excluye /catalog justo para dejar que la pagina lo maneje.
  const contentRef = useRef(null);
  const searchKey  = searchParams.toString();
  useEffect(() => {
    contentRef.current?.scrollIntoView({ block: 'start' });
  }, [searchKey]);

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  // Deep-link ?cat=<slug>: siembra la seleccion multi al navegar (una sola
  // vez por cambio de ?cat=). Despues el aside (redux) es la fuente unica.
  useEffect(() => {
    if (catParam) dispatch(setFilter({ category: [catParam] }));
  }, [catParam, dispatch]);

  // Carga del listado/búsqueda actual. Extraído a un callback para poder
  // reintentar desde el botón del estado de error (antes el mensaje decía
  // "Inténtalo de nuevo" pero no había forma de hacerlo sin recargar).
  const loadCatalog = useCallback(() => {
    if (qParam) dispatch(searchProducts({ q: qParam }));
    else dispatch(fetchProducts({
      category: (filters.category && filters.category.length) ? filters.category : undefined,
      price_min: filters.priceMin || undefined,
      price_max: filters.priceMax || undefined,
      in_stock: filters.inStock || undefined,
      ordering: filters.ordering || undefined,
      page: pagination.page || 1,
    }));
  }, [dispatch, qParam, filters.category, filters.priceMin, filters.priceMax,
      filters.inStock, filters.ordering, pagination.page]);

  // Re-fetch whenever listing filters or page change (but not in search mode)
  useEffect(() => { loadCatalog(); }, [loadCatalog]);

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

      <div className={styles.container} ref={contentRef}>
        <div className={styles.layout}>
          <FilterSidebar dispatch={dispatch} categories={categories} filters={filters} />

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
                <p>No se pudieron cargar los productos.</p>
                {(apiError.message || apiError.statusCode) && (
                  <p className={styles.errorDetail}>
                    {apiError.statusCode ? `Error ${apiError.statusCode}` : 'Error de red'}
                    {apiError.message ? ` — ${apiError.message}` : ''}
                  </p>
                )}
                <Button variant="secondary" onClick={loadCatalog}>Reintentar</Button>
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
              <div className={styles.grid} data-testid="catalog-grid">
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

// Aside de filtros — CONTROLADO desde redux `filters` (T-20 + follow-up
// T-11). `filters.category` es un arreglo de slugs: categoria
// multi-seleccion por checkboxes (consistente con el filtro de /search),
// RangeSlider + inputs (precio), checkbox de disponibilidad, y un Chip por
// filtro activo. Todo reusando primitivos de marca.
function FilterSidebar({ dispatch, categories, filters = {} }) {
  const selected  = filters.category || [];           // arreglo de slugs (multi)
  const activeCats = categories.filter((c) => selected.includes(c.slug));
  const hasPrice  = filters.priceMin != null || filters.priceMax != null;
  const hasActive = selected.length > 0 || hasPrice || Boolean(filters.inStock);
  const toggleCategory = (slug) => {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    dispatch(setFilter({ category: next }));
  };

  return (
    <aside className={styles.sidebar}>
      {hasActive && (
        <div className={styles.activeFilters} aria-label="Filtros activos">
          {activeCats.map((cat) => (
            <Chip
              key={cat.slug}
              removable
              onRemove={() => toggleCategory(cat.slug)}
              ariaRemoveLabel={`Quitar ${cat.name}`}
            >
              {cat.name}
            </Chip>
          ))}
          {hasPrice && (
            <Chip
              removable
              onRemove={() => dispatch(setFilter({ priceMin: null, priceMax: null }))}
              ariaRemoveLabel="Quitar precio"
            >
              {`${filters.priceMin != null ? fmtMoney(filters.priceMin) : '$0'} – ${filters.priceMax != null ? fmtMoney(filters.priceMax) : '∞'}`}
            </Chip>
          )}
          {filters.inStock && (
            <Chip
              removable
              onRemove={() => dispatch(setFilter({ inStock: false }))}
              ariaRemoveLabel="Quitar disponibilidad"
            >
              Disponible inmediato
            </Chip>
          )}
        </div>
      )}

      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterTitle}>Categoría</legend>
        <div className={styles.radioList} role="group" aria-label="Categoría">
          {categories.map((cat) => (
            <label key={cat.slug} className={styles.radio}>
              <input
                type="checkbox"
                name="catalog-category"
                value={cat.slug}
                checked={selected.includes(cat.slug)}
                onChange={() => toggleCategory(cat.slug)}
              />
              <span>{cat.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <PriceFilter dispatch={dispatch} filters={filters} />

      <fieldset className={styles.filterGroup}>
        <legend className={styles.filterTitle}>Disponibilidad</legend>
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(e) => dispatch(setFilter({ inStock: e.target.checked }))}
          />
          <span className={styles.checkbox} />
          <span>Disponible inmediato</span>
        </label>
      </fieldset>

      {hasActive && (
        <Button variant="secondary" block onClick={() => dispatch(clearFilters())}>
          Limpiar filtros
        </Button>
      )}
    </aside>
  );
}

function PriceFilter({ dispatch, filters }) {
  const min = filters.priceMin != null ? String(filters.priceMin) : '';
  const max = filters.priceMax != null ? String(filters.priceMax) : '';
  const [lo, setLo] = useState(min);
  const [hi, setHi] = useState(max);

  useEffect(() => { setLo(min); }, [min]);
  useEffect(() => { setHi(max); }, [max]);

  const apply = (nlo, nhi) => dispatch(setFilter({
    priceMin: nlo === '' ? null : Number(nlo),
    priceMax: nhi === '' ? null : Number(nhi),
  }));

  const sLo = lo === '' ? 0 : Math.min(PRICE_CEILING, Math.max(0, Number(lo) || 0));
  const sHi = hi === '' ? PRICE_CEILING : Math.min(PRICE_CEILING, Math.max(0, Number(hi) || PRICE_CEILING));

  return (
    <fieldset className={styles.filterGroup}>
      <legend className={styles.filterTitle}>Rango de precio</legend>
      <RangeSlider
        min={0}
        max={PRICE_CEILING}
        value={[sLo, sHi]}
        tooltipsFormat={fmtMoney}
        onChange={([a, b]) => {
          const nlo = a <= 0 ? '' : String(a);
          const nhi = b >= PRICE_CEILING ? '' : String(b);
          setLo(nlo); setHi(nhi); apply(nlo, nhi);
        }}
        className={styles.priceSlider}
      />
      <div className={styles.sliderInputs}>
        <input
          type="number"
          placeholder="Mín MXN"
          value={lo}
          aria-label="Precio mínimo"
          onChange={(e) => setLo(e.target.value)}
          onBlur={() => apply(lo, hi)}
          className={styles.sliderInput}
        />
        <input
          type="number"
          placeholder="Máx MXN"
          value={hi}
          aria-label="Precio máximo"
          onChange={(e) => setHi(e.target.value)}
          onBlur={() => apply(lo, hi)}
          className={styles.sliderInput}
        />
      </div>
    </fieldset>
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
