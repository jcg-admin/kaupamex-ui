/**
 * SupportTicketDetailPage — PracticaYoruba
 * UC-SUPP-02: Detalle del ticket con historial de conversacion.
 */
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSupportTicket,
  SUPPORT_TICKETS_KEY,
} from '@hooks/domain/useSupportTickets';
import SupportTicketReplyForm from '@components/support/SupportTicketReplyForm';
import SupportTicketActions  from '@components/support/SupportTicketActions';
import styles from './SupportTicketDetailPage.module.scss';

const STATUS_LABEL = {
  OPEN:    'Abierto',
  REPLIED: 'Respondido',
  CLOSED:  'Cerrado',
};

const STATUS_CLASS = {
  OPEN:    'badgeOpen',
  REPLIED: 'badgeReplied',
  CLOSED:  'badgeClosed',
};

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX');
}

function authorLabel(reply) {
  if (reply.author === 'admin' || reply.admin) return 'Soporte';
  return 'Tú';
}

export default function SupportTicketDetailPage() {
  const { id }      = useParams();
  const queryClient = useQueryClient();
  const { data: current, isLoading, isError } = useSupportTicket(id);
  const lastAction = useSelector((s) => s.supportTickets.lastAction);

  // Tras una respuesta/cierre/reapertura desde los paneles, refrescamos
  // el detalle desde el servidor (React Query cache invalidation).
  useEffect(() => {
    if (!lastAction) return;
    queryClient.invalidateQueries({ queryKey: SUPPORT_TICKETS_KEY });
  }, [lastAction, queryClient]);

  if (isLoading) return <p className={styles.page}>Cargando ticket…</p>;

  if (isError) {
    return (
      <section className={styles.page}>
        <p role="alert" className={styles.error}>
          No se encontró el ticket solicitado.
        </p>
        <Link to="/support/tickets" className={styles.backLink}>
          ← Volver a mis tickets
        </Link>
      </section>
    );
  }

  if (!current) return null;

  const replies = current.replies ?? [];

  return (
    <section className={styles.page} aria-labelledby="ticket-detail-title">
      <Link to="/support/tickets" className={styles.backLink}>
        ← Volver a mis tickets
      </Link>

      <header className={styles.header}>
        <div>
          <h1 id="ticket-detail-title" className={styles.title}>
            {current.subject}
          </h1>
          <p className={styles.meta}>
            Ticket #{current.id} · Abierto el {formatDateTime(current.created_at)}
          </p>
        </div>
        <span className={styles[STATUS_CLASS[current.status]] || styles.badgeOpen}>
          {STATUS_LABEL[current.status] ?? current.status}
        </span>
      </header>

      <article className={styles.original}>
        <header className={styles.replyHeader}>
          <strong>Tú</strong>
          <span>{formatDateTime(current.created_at)}</span>
        </header>
        <p className={styles.replyBody}>{current.body}</p>
      </article>

      <section className={styles.thread} aria-label="Historial de la conversación">
        {replies.length === 0 && (
          <p className={styles.empty}>
            Aún no hay respuestas del equipo de soporte.
          </p>
        )}
        {replies.map((reply) => (
          <article key={reply.id} className={styles.reply}>
            <header className={styles.replyHeader}>
              <strong>{authorLabel(reply)}</strong>
              <span>{formatDateTime(reply.sent_at)}</span>
            </header>
            <p className={styles.replyBody}>{reply.body}</p>
          </article>
        ))}
      </section>

      {current.status !== 'CLOSED' && (
        <SupportTicketReplyForm ticketId={current.id} />
      )}

      <SupportTicketActions ticket={current} />
    </section>
  );
}
