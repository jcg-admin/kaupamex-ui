/**
 * SupportTicketReplyForm — PracticaYoruba
 * UC-SUPP-03: Responder al ticket de soporte.
 *
 * - El comprador añade información a su propio ticket.
 * - El admin (prop isAdmin) puede marcar la respuesta como nota interna.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { replySupportTicket } from '@redux/slices/supportTicketsSlice';
import styles from './SupportTicketReplyForm.module.scss';

const MIN_BODY_LENGTH = 10;

export default function SupportTicketReplyForm({ ticketId, isAdmin = false }) {
  const dispatch = useDispatch();
  const { isActioning, actionError } = useSelector((s) => s.supportTickets);
  const [body, setBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (body.trim().length < MIN_BODY_LENGTH) {
      setError('La respuesta debe tener al menos 10 caracteres.');
      return;
    }
    setError('');
    const result = await dispatch(
      replySupportTicket({ id: ticketId, body: body.trim(), isInternal })
    );
    if (replySupportTicket.fulfilled.match(result)) {
      setBody('');
      setIsInternal(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <div className={styles.field}>
        <label htmlFor={`reply-body-${ticketId}`}>Tu respuesta</label>
        <textarea
          id={`reply-body-${ticketId}`}
          name="body"
          rows={4}
          value={body}
          onChange={(e) => {
            setBody(e.target.value);
            if (error) setError('');
          }}
          aria-invalid={Boolean(error)}
        />
        {error && <span className={styles.error}>{error}</span>}
      </div>

      {isAdmin && (
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
          />
          Nota interna (solo visible para el equipo)
        </label>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {typeof actionError === 'string'
            ? actionError
            : 'No se pudo enviar la respuesta.'}
        </p>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning}
        >
          {isActioning ? 'Enviando…' : 'Enviar respuesta'}
        </button>
      </div>
    </form>
  );
}
