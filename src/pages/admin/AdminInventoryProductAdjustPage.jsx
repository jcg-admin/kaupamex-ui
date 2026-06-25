/**
 * AdminInventoryProductAdjustPage — PracticaYoruba
 * UC-INV-04: Ajustar stock manualmente para productos SIN variante.
 *
 * H-CICLO110-03: AdminInventoryPage mostraba "Sin variante" sin enlace
 * de accion para productos sin variantes. El API tiene el endpoint
 * POST /api/v2/admin/inventory/<productId>/adjust/ (StockAdjustView)
 * que acepta delta + reason + notes, pero la UI carecia de ruta y pagina.
 * Este componente cubre ese hueco usando adjustProductStockManually.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  adjustProductStockManually,
  clearInventoryActionState,
} from '@redux/slices/inventorySlice';
import styles from './AdminInventoryAdjustPage.module.scss';

const REASON_OPTIONS = [
  { value: 'PHYSICAL_COUNT', label: 'Conteo físico' },
  { value: 'LOSS',           label: 'Merma' },
  { value: 'THEFT',          label: 'Robo' },
  { value: 'RETURN',         label: 'Devolución' },
  { value: 'DISCONTINUED',   label: 'Descontinuado' },
  { value: 'OTHER',          label: 'Otro' },
];

export default function AdminInventoryProductAdjustPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.inventory);

  const [delta, setDelta]           = useState('');
  const [reason, setReason]         = useState('PHYSICAL_COUNT');
  const [notes, setNotes]           = useState('');

  useEffect(() => () => {
    dispatch(clearInventoryActionState());
  }, [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = Number(delta);
    if (Number.isNaN(parsed)) return;
    dispatch(adjustProductStockManually({
      productId,
      delta: parsed,
      reason,
      notes: notes.trim(),
    }));
  };

  const errorMessage = (() => {
    if (!actionError) return null;
    if (typeof actionError === 'string') return actionError;
    if (actionError?.detail) return actionError.detail;
    if (actionError?.message) return actionError.message;
    return 'No se pudo ajustar el stock. Intenta de nuevo.';
  })();

  return (
    <section className={styles.page} aria-labelledby="adjust-title">
      <Link to="/admin/inventory" className={styles.backLink}>
        ← Volver al inventario
      </Link>

      <h1 id="adjust-title" className={styles.title}>
        Ajustar stock manualmente
      </h1>
      <p className={styles.meta}>Producto #{productId}</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="delta">
            Delta (positivo = entrada, negativo = salida)
          </label>
          <input
            id="delta"
            type="number"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            required
            placeholder="Ej: 10 o -5"
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="reason">Motivo</label>
          <select
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="notes">Notas (opcional)</label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {errorMessage && (
          <p role="alert" className={styles.error}>{errorMessage}</p>
        )}

        {lastAction === 'adjusted' && (
          <p className={styles.success}>Stock ajustado correctamente.</p>
        )}

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning}
        >
          {isActioning ? 'Aplicando…' : 'Aplicar ajuste'}
        </button>
      </form>
    </section>
  );
}
