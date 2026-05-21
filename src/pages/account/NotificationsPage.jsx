/**
 * NotificationsPage — PracticaYoruba
 * UC-NOT-01..05: Bandeja de notificaciones del comprador.
 *
 * Lectura via React Query (`useNotificationsList`). Mutaciones
 * (marcar leida, marcar todas) via Redux + invalidacion de query.
 */
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotificationsActionState,
} from '@redux/slices/notificationsSlice';
import {
  useNotificationsList,
  NOTIFICATIONS_KEY,
  NOTIFICATIONS_UNREAD_COUNT_KEY,
} from '@hooks/domain/useNotifications';
import { useEffect } from 'react';
import styles from './NotificationsPage.module.scss';

const TYPE_LABEL = {
  ORDER_UPDATE:   'Orden',
  RETURN_UPDATE:  'Devolución',
  SYSTEM:         'Sistema',
  PROMOTION:      'Promoción',
  SUPPORT_UPDATE: 'Soporte',
};

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
}

export default function NotificationsPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading, isError } = useNotificationsList();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.notifications);

  useEffect(() => () => { dispatch(clearNotificationsActionState()); }, [dispatch]);

  useEffect(() => {
    if (lastAction === 'marked_read' || lastAction === 'marked_all_read') {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_COUNT_KEY });
    }
  }, [lastAction, queryClient]);

  function handleMarkRead(id) {
    dispatch(markNotificationAsRead(id));
  }

  function handleMarkAllRead() {
    dispatch(markAllNotificationsAsRead());
  }

  const hasUnread = items.some((n) => !n.is_read);

  return (
    <section className={styles.page} aria-labelledby="notifications-title">
      <header className={styles.header}>
        <h1 id="notifications-title" className={styles.title}>
          Mis notificaciones
        </h1>
        {hasUnread && (
          <button
            className={styles.secondaryBtn}
            onClick={handleMarkAllRead}
            disabled={isActioning}
            aria-label="Marcar todas las notificaciones como leídas"
          >
            Marcar todas como leídas
          </button>
        )}
      </header>

      {isLoading && <p>Cargando notificaciones…</p>}

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar las notificaciones. Intenta de nuevo.
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError?.detail ?? 'Ocurrió un error. Intenta de nuevo.'}
        </p>
      )}

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No tienes notificaciones.</p>
      )}

      {items.length > 0 && (
        <ul className={styles.list}>
          {items.map((notif) => (
            <li
              key={notif.id}
              className={`${styles.item} ${notif.is_read ? styles.itemRead : styles.itemUnread}`}
            >
              <div className={styles.itemBody}>
                <span className={styles.itemType}>
                  {TYPE_LABEL[notif.type] ?? notif.type}
                </span>
                <p className={styles.itemSubject}>{notif.subject}</p>
                <p className={styles.itemText}>{notif.body}</p>
                <time className={styles.itemDate} dateTime={notif.created_at}>
                  {formatDate(notif.created_at)}
                </time>
              </div>
              {!notif.is_read && (
                <button
                  className={styles.markReadBtn}
                  onClick={() => handleMarkRead(notif.id)}
                  disabled={isActioning}
                  aria-label={`Marcar notificación "${notif.subject}" como leída`}
                >
                  Marcar como leída
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
