/**
 * SupportTicketActions — PracticaYoruba
 * UC-SUPP-04: Cerrar o reabrir el ticket de soporte.
 *
 * Si el ticket esta OPEN o REPLIED muestra «Cerrar ticket».
 * Si el ticket esta CLOSED muestra «Reabrir ticket».
 */
import { useDispatch, useSelector } from 'react-redux';
import {
  closeSupportTicket,
  reopenSupportTicket,
} from '@redux/slices/supportTicketsSlice';
import styles from './SupportTicketActions.module.scss';

const CLOSABLE_STATUSES = new Set(['OPEN', 'IN_PROGRESS', 'AWAITING_USER', 'RESOLVED']);

export default function SupportTicketActions({ ticket }) {
  const dispatch = useDispatch();
  const { isActioning, actionError } = useSelector((s) => s.supportTickets);

  if (!ticket) return null;

  const handleClose = () => {
    const ok = window.confirm(
      '¿Marcar este ticket como resuelto? Podrás reabrirlo si el problema persiste.'
    );
    if (!ok) return;
    dispatch(closeSupportTicket({ id: ticket.ticket_id, reason: '' }));
  };

  const handleReopen = () => {
    const ok = window.confirm('¿Reabrir este ticket?');
    if (!ok) return;
    dispatch(reopenSupportTicket(ticket.ticket_id));
  };

  if (ticket.status === 'CLOSED') {
    return (
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleReopen}
          disabled={isActioning}
        >
          Reabrir ticket
        </button>
        {actionError && (
          <p role="alert" className={styles.error}>
            {typeof actionError === 'string' ? actionError : 'No se pudo reabrir el ticket.'}
          </p>
        )}
      </div>
    );
  }

  if (CLOSABLE_STATUSES.has(ticket.status)) {
    return (
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.dangerBtn}
          onClick={handleClose}
          disabled={isActioning}
        >
          Cerrar ticket
        </button>
        {actionError && (
          <p role="alert" className={styles.error}>
            {typeof actionError === 'string' ? actionError : 'No se pudo cerrar el ticket.'}
          </p>
        )}
      </div>
    );
  }

  return null;
}
