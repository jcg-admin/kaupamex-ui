// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/SearchModal/SearchModal.jsx
/**
 * SearchModal — ecommerce-ui
 * Overlay de búsqueda rápida activado por el Header (toggleSearch).
 * Muestra resultados en vivo mientras el usuario escribe (≥ 2 caracteres).
 * Al confirmar navega a /search?q=<término>.
 *
 * Renderiza cuando uiSlice.isSearchOpen = true.
 */
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector }     from 'react-redux';
import { useNavigate, Link }            from 'react-router-dom';
import { closeSearch }                  from '@redux/slices/uiSlice';
import { selectIsSearchOpen }           from '@redux/selectors';
import { useSearch, isQueryValid }      from '@hooks/domain/useSearch';
import styles from './SearchModal.module.scss';

export default function SearchModal() {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const isOpen        = useSelector(selectIsSearchOpen);
  const [query, setQuery] = useState('');
  const inputRef      = useRef(null);

  const { data, isFetching } = useSearch(
    { q: query },
    { enabled: isOpen && isQueryValid(query) },
  );
  const results = data?.results ?? [];

  // Focus automático al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dispatch(closeSearch()); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dispatch]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    dispatch(closeSearch());
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleResultClick = () => dispatch(closeSearch());

  const showResults = isQueryValid(query);
  const hasResults  = results.length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className={styles.backdrop}
        onClick={() => dispatch(closeSearch())}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar productos"
      >
        <form onSubmit={handleSubmit} className={styles.form} role="search">
          <input
            ref={inputRef}
            type="search"
            className={styles.input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar elekes, otanes, herramientas de òrìsà…"
            aria-label="Término de búsqueda"
            aria-autocomplete="list"
            aria-controls="search-results"
          />
          <button type="submit" className={styles.btn} disabled={!query.trim()}>
            Buscar
          </button>
          <button
            type="button"
            className={styles.btnClose}
            onClick={() => dispatch(closeSearch())}
            aria-label="Cerrar búsqueda"
          >
            ✕
          </button>
        </form>

        {showResults && (
          <div className={styles.results} id="search-results" role="listbox">
            {isFetching && (
              <p className={styles.hint}>Buscando…</p>
            )}
            {!isFetching && !hasResults && (
              <p className={styles.hint}>
                Sin resultados para <strong>{query}</strong>
              </p>
            )}
            {!isFetching && hasResults && (
              <ul className={styles.resultList}>
                {results.slice(0, 8).map((p) => (
                  <li key={p.id} role="option">
                    <Link
                      to={`/catalog/${p.slug}`}
                      className={styles.resultItem}
                      onClick={handleResultClick}
                    >
                      {p.cover_image_url && (
                        <img
                          src={p.cover_image_url}
                          alt=""
                          aria-hidden="true"
                          className={styles.resultThumb}
                        />
                      )}
                      <span className={styles.resultInfo}>
                        <span className={styles.resultName}>{p.name}</span>
                        {p.price && (
                          <span className={styles.resultPrice}>
                            ${Number(p.price).toLocaleString('es-MX')} MXN
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {!isFetching && hasResults && (
              <button
                type="button"
                className={styles.seeAll}
                onClick={handleSubmit}
              >
                Ver todos los resultados para &ldquo;{query}&rdquo; →
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
