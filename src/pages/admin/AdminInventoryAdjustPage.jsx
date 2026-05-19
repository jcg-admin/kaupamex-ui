/**
 * AdminInventoryAdjustPage — PracticaYoruba
 * UC-INV-04: Ajustar stock manualmente con motivo obligatorio.
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  adjustStockManually,
  clearInventoryActionState,
} from '@redux/slices/inventorySlice';
import styles from './AdminInventoryAdjustPage.module.scss';

const REASON_OPTIONS = [
  { value: 'CONTEO_FISICO', label: 'Conteo físico' },
  { value: 'MERMA',         label: 'Merma' },
  { value: 'ROBO',          label: 'Robo' },
  { value: 'DEVOLUCION',    label: 'Devolución' },
  { value: 'DESCONTINUADO', label: 'Descontinuado' },
  { value: 'OTRO',          label: 'Otro' },
];

export default function AdminInventoryAdjustPage() {
  const { variantId } = useParams();
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.inventory);

  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason]           = useState('CONTEO_FISICO');
  const [observations, setObservations] = useState('');

  useEffect(() => () => {
    dispatch(clearInventoryActionState());
  }, [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const parsed = Number(newQuantity);
    if (Number.isNaN(parsed) || parsed < 0) return;
    dispatch(adjustStockManually({
      variantId,
      newQuantity: parsed,
      reason,
      observations: observations.trim(),
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
      <p className={styles.meta}>Variante #{variantId}</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="new-quantity">Cantidad nueva</label>
          <input
            id="new-quantity"
            type="number"
            min="0"
            value={newQuantity}
            onChange={(e) => setNewQuantity(e.target.value)}
            required
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
          <label htmlFor="observations">Observaciones (opcional)</label>
          <textarea
            id="observations"
            rows={3}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
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
