/**
 * AdminReturnReceptionPanel — PracticaYoruba
 * UC-RET-03: Registrar la recepción física del producto devuelto.
 * Solo visible cuando la solicitud está APROBADA y aún no tiene
 * `received_at` (la recepción no se ha registrado).
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerReturnReception } from '@redux/slices/returnsSlice';
import styles from './AdminReturnReceptionPanel.module.scss';

const CONDITIONS = [
  { value: 'BUENAS_CONDICIONES', label: 'Buenas condiciones' },
  { value: 'DANADO',             label: 'Dañado' },
  { value: 'INCOMPLETO',         label: 'Incompleto' },
];

export default function AdminReturnReceptionPanel({ returnRequest }) {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.returns);
  const [condition, setCondition]       = useState('BUENAS_CONDICIONES');
  const [observations, setObservations] = useState('');

  const eligible =
    returnRequest &&
    returnRequest.status === 'APROBADA' &&
    !returnRequest.received_at;

  if (!eligible) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    dispatch(registerReturnReception({
      id:               returnRequest.id,
      productCondition: condition,
      observations:     observations.trim(),
    }));
  };

  return (
    <section className={styles.panel} aria-label="Recepción del producto">
      <h2 className={styles.title}>Recepción física</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="return-product-condition">Estado del producto</label>
          <select
            id="return-product-condition"
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
          >
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="return-observations">Observaciones (opcional)</label>
          <textarea
            id="return-observations"
            rows={3}
            value={observations}
            onChange={(event) => setObservations(event.target.value)}
          />
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {typeof actionError === 'string'
              ? actionError
              : 'No se pudo registrar la recepción. Intenta de nuevo.'}
          </p>
        )}

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning}
        >
          {isActioning ? 'Registrando…' : 'Registrar recepción'}
        </button>

        {lastAction === 'received' && (
          <p className={styles.success}>
            Recepción registrada. La devolución pasó a COMPLETADA.
          </p>
        )}
      </form>
    </section>
  );
}
