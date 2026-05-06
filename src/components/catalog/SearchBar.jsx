/**
 * SearchBar — PracticaYoruba
 * Campo de búsqueda UC-CAT-03 / UC-SRCH-01.
 * Mínimo 2 caracteres para ejecutar búsqueda (FR-CAT-03.02).
 */
import { useState } from 'react';
import styles from './SearchBar.module.scss';

const MIN_LENGTH = 2;

export default function SearchBar({ onSearch, initialValue = '', isSearching = false }) {
  const [value, setValue] = useState(initialValue);
  const [error, setError]   = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = value.trim().replace(/\s+/g, ' ');
    if (q.length < MIN_LENGTH) {
      setError(`Ingresa al menos ${MIN_LENGTH} caracteres para buscar.`);
      return;
    }
    setError('');
    onSearch(q);
  };

  const handleChange = (e) => {
    setValue(e.target.value);
    if (error) setError('');
  };

  return (
    <form
      className={styles.form}
      onSubmit={handleSubmit}
      role="search"
      aria-label="Buscar productos"
    >
      <div className={styles.inputWrapper}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input
          className={styles.input}
          type="search"
          name="q"
          value={value}
          onChange={handleChange}
          placeholder="Buscar collares, pulseras, soperas..."
          aria-label="Término de búsqueda"
          aria-describedby={error ? 'search-error' : undefined}
          autoComplete="off"
          maxLength={100}
        />
        {value && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={() => { setValue(''); setError(''); }}
            aria-label="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isSearching}
        aria-busy={isSearching}
      >
        {isSearching ? 'Buscando...' : 'Buscar'}
      </button>

      {error && (
        <p id="search-error" className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
