/**
 * NotificationsPage — PracticaYoruba
 * UC-NOT-01..05: Bandeja de notificaciones del comprador.
 *
 * Lectura via React Query (`useNotificationsList`). Mutaciones
 * (marcar leida, marcar todas) via Redux + invalidacion de query.
 *
 * H-CICLO88-02: la API pagina la bandeja (50 por pagina, max 500 filas).
 * Se agrega boton "Cargar mas" que avanza de pagina cuando existe
 * pagina siguiente.  Sin paginacion un admin podia crear miles de
 * notificaciones para un usuario y el endpoint retornaba toda la tabla
 * en un solo response, causando OOM en el worker y freeze en el UI.
 */
import { useState } from 'react';
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
  const [page, setPage]         = useState(1);
  const [allItems, setAllItems] = useState([]);

  const { data: pageData, isLoading, isError } = useNotificationsList({ page });
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.notifications);

  // Accumulate items across pages.
  useEffect(() => {
    if (!pageData) return;
    const incoming = pageData.results ?? [];
    if (page === 1) {
      setAllItems(incoming);
    } else {
      setAllItems((prev) => [...prev, ...incoming]);
    }
  }, [pageData, page]);

  useEffect(() => () => { dispatch(clearNotificationsActionState()); }, [dispatch]);

  useEffect(() => {
    if (lastAction === 'marked_read' || lastAction === 'marked_all_read') {
      // Reset to page 1 and clear accumulator so updated read-state loads fresh.
      setPage(1);
      setAllItems([]);
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

  function handleLoadMore() {
    setPage((p) => p + 1);
  }

  const hasNext  = Boolean(pageData?.next);
  const hasUnread = allItems.some((n) => !n.is_read);

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

      {isLoading && page === 1 && <p>Cargando notificaciones…</p>}

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

      {!isLoading && allItems.length === 0 && (
        <p className={styles.empty}>No tienes notificaciones.</p>
      )}

      {allItems.length > 0 && (
        <ul className={styles.list}>
          {allItems.map((notif) => (
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

      {hasNext && (
        <div className={styles.loadMore}>
          <button
            className={styles.secondaryBtn}
            onClick={handleLoadMore}
            disabled={isLoading}
            aria-label="Cargar más notificaciones"
          >
            {isLoading ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </section>
  );
}
