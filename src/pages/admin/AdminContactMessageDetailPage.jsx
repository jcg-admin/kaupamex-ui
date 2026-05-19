/**
 * AdminContactMessageDetailPage — PracticaYoruba
 * UC-COM-03: detalle del mensaje + responder al remitente.
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  replyContactMessage,
  markContactMessageRead,
  clearContactActionState,
} from '@redux/slices/contactSlice';
import { useAdminContactMessage } from '@hooks/domain/useContactMessages';
import styles from './AdminContactMessageDetailPage.module.scss';

const STATUS_LABEL = {
  UNREAD:    'Sin leer',
  READ:      'Leido',
  REPLIED:   'Respondido',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX');
}

export default function AdminContactMessageDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { data: message, isLoading, isError } = useAdminContactMessage(id);
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.contact);

  const [replyBody, setReplyBody] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [error, setError] = useState('');

  // Marca el mensaje como leido al abrirlo (UC-COM-02 paso 5).
  useEffect(() => {
    if (message?.id && message?.status === 'UNREAD') {
      dispatch(markContactMessageRead(message.id));
    }
  }, [message?.id, message?.status, dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!replyBody.trim()) {
      setError('La respuesta es obligatoria.');
      return;
    }
    setError('');
    dispatch(clearContactActionState());
    dispatch(replyContactMessage({
      id,
      replyBody:    replyBody.trim(),
      internalNote: internalNote.trim() || null,
    }));
  };

  if (isLoading) return <p className={styles.page}>Cargando mensaje…</p>;
  if (isError || !message) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>
          No se pudo cargar el mensaje.
        </p>
        <Link to="/admin/contact/messages" className={styles.backLink}>
          Volver a la bandeja
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="contact-detail-title">
      <header className={styles.header}>
        <Link to="/admin/contact/messages" className={styles.backLink}>
          ← Volver a la bandeja
        </Link>
        <h1 id="contact-detail-title" className={styles.title}>
          {message.subject}
        </h1>
        <p className={styles.meta}>
          De <strong>{message.name}</strong> &lt;{message.email}&gt;
          {' · '}
          <span>{formatDate(message.created_at)}</span>
          {' · '}
          <span className={styles.status}>
            {STATUS_LABEL[message.status] ?? message.status}
          </span>
        </p>
      </header>

      <article className={styles.original}>
        <h2 className={styles.sectionTitle}>Mensaje original</h2>
        <p className={styles.body}>{message.message}</p>
      </article>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <h2 className={styles.sectionTitle}>Responder</h2>

        <div className={styles.field}>
          <label htmlFor="reply-body">Respuesta para el remitente</label>
          <textarea
            id="reply-body"
            rows={6}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            aria-invalid={Boolean(error)}
          />
          {error && <span className={styles.fieldError}>{error}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="internal-note">Nota interna (opcional)</label>
          <textarea
            id="internal-note"
            rows={3}
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
          />
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo enviar la respuesta.'}
          </p>
        )}

        {lastAction === 'replied' && (
          <p role="status" className={styles.success}>
            Respuesta enviada al remitente.
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
    </section>
  );
}
