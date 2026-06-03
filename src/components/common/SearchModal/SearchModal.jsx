// Portado del prototipo funcional template-ecommerce-ui (codigo propio del ejecutor).
// Origen: template-ecommerce-ui/src/components/common/SearchModal/SearchModal.jsx
/**
 * SearchModal — ecommerce-ui
 * Overlay de búsqueda rápida activado por el Header (toggleSearch).
 * Al confirmar navega a /search?q=<término>.
 *
 * Renderiza cuando uiSlice.isSearchOpen = true.
 */
import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector }     from 'react-redux';
import { useNavigate }                  from 'react-router-dom';
import { closeSearch }                  from '@redux/slices/uiSlice';
import { selectIsSearchOpen }           from '@redux/selectors';
import styles from './SearchModal.module.scss';

export default function SearchModal() {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const isOpen        = useSelector(selectIsSearchOpen);
  const [query, setQuery] = useState('');
  const inputRef      = useRef(null);

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
      </div>
    </>
  );
}
