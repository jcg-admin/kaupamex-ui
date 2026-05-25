/**
 * SupportTicketsPage — PracticaYoruba
 * UC-SUPP-02: Listar tickets de soporte del comprador autenticado.
 */
import { Link } from 'react-router-dom';
import { useSupportTickets } from '@hooks/domain/useSupportTickets';
import styles from './SupportTicketsPage.module.scss';

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

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('es-MX');
}

export default function SupportTicketsPage() {
  const { data: items = [], isLoading, isError } = useSupportTickets();

  return (
    <section className={styles.page} aria-labelledby="tickets-title">
      <header className={styles.header}>
        <h1 id="tickets-title" className={styles.title}>
          Mis tickets de soporte
        </h1>
        <Link to="/support/tickets/new" className={styles.primaryBtn}>
          Abrir nuevo ticket
        </Link>
      </header>

      {isLoading && <p>Cargando tickets…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar tus tickets. Intenta de nuevo.
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>
          No tienes tickets de soporte registrados.
        </p>
      )}

      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((ticket) => {
            // H-CICLO35-01: SupportTicketListSerializer expone ticket_id (source='pk'),
            // no id. Usar ticket.ticket_id como clave primaria.
            const tid = ticket.ticket_id ?? ticket.id;
            return (
            <li key={tid} className={styles.item}>
              <Link to={`/support/tickets/${tid}`} className={styles.itemLink}>
                <div className={styles.itemMain}>
                  <span className={styles.itemSubject}>{ticket.subject}</span>
                  <span className={styles.itemId}>#{tid}</span>
                </div>
                <div className={styles.itemMeta}>
                  <span className={styles[STATUS_CLASS[ticket.status]] || styles.badgeOpen}>
                    {STATUS_LABEL[ticket.status] ?? ticket.status}
                  </span>
                  <span className={styles.itemDate}>{formatDate(ticket.created_at)}</span>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
