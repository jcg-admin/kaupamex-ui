/**
 * AdminPriceSyncPage — UC-CAT-12.
 *
 * Herramienta de sincronizacion masiva de precios para el admin
 * (/admin/price-sync). Dos modos:
 *
 *   1) CSV — sube un archivo con columnas `sku` y `price` (sin IVA),
 *      el backend retorna una vista previa con `current_price`,
 *      `new_price`, `diff_pct` y `status` por fila. El admin revisa
 *      y confirma. La aplicacion es atomica (POST-01) y dispara la
 *      invalidacion de cache (POST-02) + auditoria (POST-03).
 *
 *   2) Ajuste porcentual (Alt A) — el admin filtra productos por
 *      categoria o rango de precio actual e introduce un porcentaje
 *      (positivo = aumento, negativo = descuento). Mismo ciclo
 *      preview → confirm.
 *
 * Excepciones:
 *   - EX-01 (CSV invalido) — mensaje del backend.
 *   - EX-02 (precio invalido <= 0) — filas marcadas «invalido», admin
 *     decide si continuar con las validas.
 *   - EX-03 (error al persistir) — 503 visible en applyError.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  previewCsv, applyCsv,
  previewPercentage, applyPercentage,
  clearPriceSyncState,
} from '@redux/slices/priceSyncSlice';
import styles from './AdminPriceSyncPage.module.scss';

function fmt(n) {
  return Number(n ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

export default function AdminPriceSyncPage() {
  const dispatch = useDispatch();
  const {
    isLoading, isApplying,
    previewError, applyError,
    preview, applyReport,
  } = useSelector((s) => s.priceSync ?? {});

  const [mode, setMode] = useState('csv'); // 'csv' | 'percentage'
  const [file, setFile] = useState(null);
  const [percentage, setPercentage] = useState('');
  const [category, setCategory]     = useState('');
  const [priceMin, setPriceMin]     = useState('');
  const [priceMax, setPriceMax]     = useState('');

  useEffect(() => () => { dispatch(clearPriceSyncState()); }, [dispatch]);

  const switchMode = (next) => {
    if (next === mode) return;
    dispatch(clearPriceSyncState());
    setMode(next);
  };

  const handleCsvPreview = (e) => {
    e.preventDefault();
    if (!file) return;
    dispatch(previewCsv({ file }));
  };

  const handlePercentagePreview = (e) => {
    e.preventDefault();
    const pct = Number(percentage);
    if (!Number.isFinite(pct) || pct === 0) return;
    dispatch(previewPercentage({
      percentage: pct,
      category,
      price_min: priceMin === '' ? null : Number(priceMin),
      price_max: priceMax === '' ? null : Number(priceMax),
    }));
  };

  const handleConfirm = () => {
    // H-CICLO70-01: API returns session_id (not token) — use preview.session_id.
    if (!preview?.session_id) return;
    if (mode === 'csv') dispatch(applyCsv({ session_id: preview.session_id }));
    else dispatch(applyPercentage({ session_id: preview.session_id }));
  };

  const handleDownloadTemplate = () => {
    // Alt C — link de descarga directa servido por el backend.
    window.location.href = '/api/v1/admin/price-sync/template.csv';
  };

  // H-CICLO70-01: API preview shape is { session_id, preview: [...], valid_count,
  // invalid_count } — not { rows, summary, token }.
  const rows       = preview?.preview    ?? [];
  const validCount = preview?.valid_count   ?? null;
  const invalidCount = preview?.invalid_count ?? null;

  return (
    <section className={styles.page} aria-labelledby="price-sync-title">
      <Link to="/admin/products" className={styles.backLink}>
        ← Volver al catalogo
      </Link>

      <h1 id="price-sync-title" className={styles.title}>
        Sincronizar precios
      </h1>
      <p className={styles.description}>
        Actualiza precios sin IVA en lote, ya sea cargando un CSV
        (columnas <code>sku</code> y <code>price</code>) o aplicando un
        ajuste porcentual sobre una seleccion. Los cambios solo se
        aplican tras confirmar la vista previa.
      </p>

      <div className={styles.tabs} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'csv'}
          className={mode === 'csv' ? styles.tabActive : styles.tab}
          onClick={() => switchMode('csv')}
        >
          Cargar CSV
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'percentage'}
          className={mode === 'percentage' ? styles.tabActive : styles.tab}
          onClick={() => switchMode('percentage')}
        >
          Ajuste porcentual
        </button>
      </div>

      {mode === 'csv' && (
        <form onSubmit={handleCsvPreview} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="price-sync-csv">Archivo CSV</label>
            <input
              id="price-sync-csv"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className={styles.formActions}>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={!file || isLoading}
            >
              {isLoading ? 'Procesando...' : 'Generar vista previa'}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleDownloadTemplate}
            >
              Descargar plantilla
            </button>
          </div>
        </form>
      )}

      {mode === 'percentage' && (
        <form onSubmit={handlePercentagePreview} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="price-sync-pct">Porcentaje de ajuste</label>
            <input
              id="price-sync-pct"
              type="number"
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Ej. 5 = +5%, -10 = -10%"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="price-sync-cat">Categoria (slug)</label>
            <input
              id="price-sync-cat"
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="price-sync-min">Precio actual minimo</label>
            <input
              id="price-sync-min"
              type="number"
              min="0"
              step="0.01"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="price-sync-max">Precio actual maximo</label>
            <input
              id="price-sync-max"
              type="number"
              min="0"
              step="0.01"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={!percentage || isLoading}
          >
            {isLoading ? 'Procesando...' : 'Generar vista previa'}
          </button>
        </form>
      )}

      {previewError && (
        <p role="alert" className={styles.error}>
          {previewError.message}
        </p>
      )}

      {applyError && (
        <p role="alert" className={styles.error}>
          {applyError.message}
        </p>
      )}

      {validCount !== null && (
        <p className={styles.summary} aria-live="polite">
          Vista previa: <strong>{validCount}</strong> filas validas,{' '}
          <strong>{invalidCount ?? 0}</strong> invalidas.
        </p>
      )}

      {rows.length > 0 && (
        <>
          <table className={styles.table} aria-label="Vista previa de cambios">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Precio actual</th>
                <th>Nuevo precio</th>
                <th>Diferencia %</th>
                <th>Producto</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                // H-CICLO70-01: API row fields are old_price (not current_price);
                // rows in the `preview` array are always valid — no status field.
                <tr key={`${r.sku}-${idx}`}>
                  <td>{r.sku}</td>
                  <td>${fmt(r.old_price)}</td>
                  <td>${fmt(r.new_price)}</td>
                  <td>{r.diff_pct != null ? `${fmt(r.diff_pct)}%` : '—'}</td>
                  <td>{r.product_name}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.confirmActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleConfirm}
              disabled={isApplying || !preview?.session_id}
            >
              {isApplying ? 'Aplicando...' : 'Confirmar y aplicar'}
            </button>
          </div>
        </>
      )}

      {applyReport && (
        // H-CICLO70-01: API apply response has updated_count (not updated/skipped).
        <p role="status" className={styles.success}>
          Operacion completada: <strong>{applyReport.updated_count}</strong>{' '}
          precios actualizados.
        </p>
      )}
    </section>
  );
}
