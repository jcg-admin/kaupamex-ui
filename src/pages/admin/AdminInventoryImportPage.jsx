/**
 * AdminInventoryImportPage — PracticaYoruba
 * UC-INV-05: Importar productos desde CSV.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  importProductsCsv,
  clearInventoryActionState,
  clearImportReport,
} from '@redux/slices/inventorySlice';
import styles from './AdminInventoryImportPage.module.scss';

export default function AdminInventoryImportPage() {
  const dispatch = useDispatch();
  const { isActioning, actionError, importReport } =
    useSelector((s) => s.inventory);

  const [file, setFile] = useState(null);

  useEffect(() => () => {
    dispatch(clearInventoryActionState());
    dispatch(clearImportReport());
  }, [dispatch]);

  const handleFileChange = (event) => {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!file) return;
    dispatch(importProductsCsv({ file }));
  };

  const errorMessage = (() => {
    if (!actionError) return null;
    if (typeof actionError === 'string') return actionError;
    if (actionError?.detail) return actionError.detail;
    if (actionError?.message) return actionError.message;
    return 'No se pudo procesar el archivo CSV. Intenta de nuevo.';
  })();

  return (
    <section className={styles.page} aria-labelledby="import-title">
      <Link to="/admin/inventory" className={styles.backLink}>
        ← Volver al inventario
      </Link>

      <h1 id="import-title" className={styles.title}>
        Importar productos desde CSV
      </h1>

      <p className={styles.description}>
        Sube un archivo CSV con los encabezados: <code>sku</code>,{' '}
        <code>name</code>, <code>base_price</code>, <code>category_slug</code>.
        Los productos válidos se crearán en estado borrador.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="csv-file">Archivo CSV</label>
          <input
            id="csv-file"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
          />
        </div>

        {errorMessage && (
          <p role="alert" className={styles.error}>{errorMessage}</p>
        )}

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning || !file}
        >
          {isActioning ? 'Importando…' : 'Importar'}
        </button>
      </form>

      {importReport && (
        <section className={styles.report} aria-label="Reporte de importación">
          <h2 className={styles.reportTitle}>Reporte de importación</h2>
          <p className={styles.created}>
            {importReport.products_created ?? 0} productos creados.
          </p>
          <p className={styles.failed}>
            {importReport.products_failed ?? 0} productos fallidos.
          </p>

          {(importReport.error_report ?? []).length > 0 && (
            <table className={styles.errors}>
              <thead>
                <tr>
                  <th>Fila</th>
                  <th>Campo</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {importReport.error_report.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.row ?? '—'}</td>
                    <td>{row.field ?? '—'}</td>
                    <td>{row.reason ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {importReport.download_url && (
            <p className={styles.downloadLink}>
              <a href={importReport.download_url} download>
                Descargar reporte de errores
              </a>
            </p>
          )}
        </section>
      )}
    </section>
  );
}
