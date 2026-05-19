/**
 * NotificationPreferencesPage — PracticaYoruba
 * UC-NOT-06: Gestionar preferencias de notificacion por email.
 *
 * Lectura inicial via React Query (`useNotificationPreferences`). La
 * mutacion (`updateNotificationPreferences`) sigue en Redux porque
 * comparte `lastAction`/`isActioning` con el resto del slice. Tras
 * exito invalidamos la query para refrescar el draft.
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  updateNotificationPreferences,
  clearNotificationsActionState,
} from '@redux/slices/notificationsSlice';
import {
  useNotificationPreferences,
  NOTIFICATION_PREFERENCES_KEY,
} from '@hooks/domain/useNotifications';
import styles from './NotificationPreferencesPage.module.scss';

export default function NotificationPreferencesPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const {
    data: preferences,
    isLoading,
    isError: isReadError,
  } = useNotificationPreferences();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.notifications);

  const [draft, setDraft] = useState([]);

  useEffect(() => () => { dispatch(clearNotificationsActionState()); }, [dispatch]);

  useEffect(() => {
    if (preferences) setDraft(preferences);
  }, [preferences]);

  // Tras un guardado exitoso, refresca la query (cache invalidation).
  useEffect(() => {
    if (lastAction === 'preferences_saved') {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_PREFERENCES_KEY });
    }
  }, [lastAction, queryClient]);

  const handleToggle = (type) => {
    setDraft((items) =>
      items.map((pref) =>
        pref.type === type && !pref.mandatory
          ? { ...pref, enabled: !pref.enabled }
          : pref,
      ),
    );
  };

  const handleOptOutOptional = () => {
    setDraft((items) =>
      items.map((pref) =>
        pref.mandatory ? pref : { ...pref, enabled: false },
      ),
    );
  };

  const handleSave = () => {
    dispatch(updateNotificationPreferences(draft));
  };

  return (
    <section className={styles.page} aria-labelledby="prefs-title">
      <header className={styles.header}>
        <h1 id="prefs-title" className={styles.title}>
          Preferencias de notificacion
        </h1>
        <p className={styles.description}>
          Elige que tipos de correos electronicos deseas recibir.
        </p>
      </header>

      {isLoading && <p>Cargando preferencias…</p>}

      {isReadError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar tus preferencias.
        </p>
      )}

      {draft.length > 0 && (
        <>
          <ul className={styles.list}>
            {draft.map((pref) => (
              <li key={pref.type} className={styles.item}>
                <label className={styles.itemLabel}>
                  <input
                    type="checkbox"
                    checked={Boolean(pref.enabled)}
                    disabled={pref.mandatory}
                    onChange={() => handleToggle(pref.type)}
                  />
                  {' '}
                  {pref.label ?? pref.type}
                  {pref.mandatory && (
                    <span className={styles.mandatoryHint}>(obligatoria)</span>
                  )}
                </label>
              </li>
            ))}
          </ul>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleSave}
              disabled={isActioning}
            >
              {isActioning ? 'Guardando…' : 'Guardar preferencias'}
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleOptOutOptional}
            >
              Desactivar todas las opcionales
            </button>
          </div>

          {lastAction === 'preferences_saved' && (
            <p className={styles.success} role="status">
              Preferencias guardadas correctamente.
            </p>
          )}

          {actionError && (
            <p role="alert" className={styles.error}>
              {actionError.message || 'No se pudo guardar. Intenta de nuevo.'}
            </p>
          )}
        </>
      )}
    </section>
  );
}
