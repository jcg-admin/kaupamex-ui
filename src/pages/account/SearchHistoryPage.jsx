/**
 * SearchHistoryPage — UC-SRCH-03.
 *
 * Vista del historial personal de busquedas del comprador autenticado
 * en /account/search-history. Lista los ultimos 20 terminos ordenados
 * por -searched_at. Permite repetir una busqueda (Link a /search?q=),
 * eliminar una entrada (Alt A) o borrar todo (Alt B).
 *
 * Stack: useSearchHistory (React Query) + searchHistorySlice
 * (mutaciones via thunks con serializeApiError).
 */
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchHistory, SEARCH_HISTORY_KEY } from '@hooks/domain/useSearchHistory';
import {
  removeSearchHistoryEntry,
  clearSearchHistory,
  clearActionState,
} from '@redux/slices/searchHistorySlice';
import styles from './SearchHistoryPage.module.scss';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function SearchHistoryPage() {
  const dispatch     = useDispatch();
  const queryClient  = useQueryClient();
  const { data, isLoading, isError, refetch } = useSearchHistory();
  const { lastAction, actionError, isMutating } = useSelector(
    (s) => s.searchHistory ?? { lastAction: null, actionError: null, isMutating: false },
  );

  // Refrescar el cache de React Query tras cada mutacion exitosa.
  useEffect(() => {
    if (lastAction) {
      queryClient.invalidateQueries({ queryKey: SEARCH_HISTORY_KEY });
      const t = setTimeout(() => dispatch(clearActionState()), 2000);
      return () => clearTimeout(t);
    }
  }, [lastAction, queryClient, dispatch]);

  const items = data?.results ?? [];

  const handleRemove = (id) => {
    dispatch(removeSearchHistoryEntry(id));
  };

  const handleClearAll = () => {
    if (window.confirm('Borrar todo el historial de busquedas?')) {
      dispatch(clearSearchHistory());
    }
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Historial de busquedas</h1>
        <p className={styles.subtitle}>
          Tus ultimas busquedas. Hasta 20 terminos personales.
        </p>
      </header>

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message}
        </p>
      )}
      {lastAction === 'removed' && (
        <p role="status" className={styles.success}>
          Entrada eliminada.
        </p>
      )}
      {lastAction === 'cleared' && (
        <p role="status" className={styles.success}>
          Historial borrado.
        </p>
      )}

      {isLoading && (
        <div className={styles.loading} aria-live="polite">
          <p>Cargando historial...</p>
        </div>
      )}

      {isError && !isLoading && (
        <div role="alert" className={styles.error}>
          No se pudo cargar el historial. Reintenta mas tarde.
        </div>
      )}

      {!isLoading && !isError && items.length === 0 && (
        <p className={styles.empty}>
          Aun no tienes busquedas guardadas. Empieza desde el{' '}
          <Link to="/catalog">catalogo</Link>.
        </p>
      )}

      {!isLoading && items.length > 0 && (
        <>
          <ul className={styles.list} aria-label="Historial de busquedas">
            {items.map((it) => (
              <li key={it.id} className={styles.item}>
                <Link
                  to={`/search?q=${encodeURIComponent(it.term)}`}
                  className={styles.term}
                >
                  {it.term}
                </Link>
                <span className={styles.date}>{formatDate(it.searched_at)}</span>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => handleRemove(it.id)}
                  disabled={isMutating}
                  aria-label={`Eliminar "${it.term}" del historial`}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.clearAllBtn}
              onClick={handleClearAll}
              disabled={isMutating}
            >
              Borrar todo el historial
            </button>
          </div>
        </>
      )}
    </main>
  );
}
