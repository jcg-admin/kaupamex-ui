/**
 * AdminReturnReviewPanel — PracticaYoruba
 * UC-RET-02: panel de revisión (aprobar / rechazar / solicitar información)
 * para solicitudes en estado PENDIENTE_REVISION o PENDIENTE_INFORMACION.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  approveReturnRequest,
  rejectReturnRequest,
  requestInfoReturnRequest,
} from '@redux/slices/returnsSlice';
import styles from './AdminReturnReviewPanel.module.scss';

const REVIEWABLE_STATES = new Set(['PENDIENTE_REVISION', 'PENDIENTE_INFORMACION']);

export default function AdminReturnReviewPanel({ returnRequest }) {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.returns);
  const [justification, setJustification] = useState('');
  const [localError, setLocalError]       = useState('');

  if (!returnRequest || !REVIEWABLE_STATES.has(returnRequest.status)) {
    return null;
  }

  const requireJustification = () => {
    if (justification.trim().length === 0) {
      setLocalError('La justificación es obligatoria.');
      return false;
    }
    setLocalError('');
    return true;
  };

  const handleApprove = () => {
    if (!requireJustification()) return;
    dispatch(approveReturnRequest({
      id:            returnRequest.id,
      justification: justification.trim(),
    }));
  };

  const handleReject = () => {
    if (!requireJustification()) return;
    dispatch(rejectReturnRequest({
      id:            returnRequest.id,
      justification: justification.trim(),
    }));
  };

  const handleRequestInfo = () => {
    if (!requireJustification()) return;
    dispatch(requestInfoReturnRequest({
      id:      returnRequest.id,
      message: justification.trim(),
    }));
  };

  return (
    <section className={styles.panel} aria-label="Revisión de la solicitud">
      <h2 className={styles.title}>Decisión</h2>

      <div className={styles.field}>
        <label htmlFor="return-justification">Justificación visible para el comprador</label>
        <textarea
          id="return-justification"
          rows={4}
          value={justification}
          onChange={(event) => setJustification(event.target.value)}
        />
        {localError && <span className={styles.error}>{localError}</span>}
      </div>

      {actionError && (
        <p role="alert" className={styles.error}>
          {typeof actionError === 'string'
            ? actionError
            : 'No se pudo registrar la decisión. Intenta de nuevo.'}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.approve}
          onClick={handleApprove}
          disabled={isActioning}
        >
          Aprobar
        </button>
        <button
          type="button"
          className={styles.reject}
          onClick={handleReject}
          disabled={isActioning}
        >
          Rechazar
        </button>
        <button
          type="button"
          className={styles.info}
          onClick={handleRequestInfo}
          disabled={isActioning}
        >
          Solicitar información
        </button>
      </div>

      {lastAction === 'approved' && (
        <p className={styles.success}>Solicitud aprobada correctamente.</p>
      )}
      {lastAction === 'rejected' && (
        <p className={styles.success}>Solicitud rechazada y notificada al comprador.</p>
      )}
      {lastAction === 'info_requested' && (
        <p className={styles.success}>Se solicitó información adicional al comprador.</p>
      )}
    </section>
  );
}
