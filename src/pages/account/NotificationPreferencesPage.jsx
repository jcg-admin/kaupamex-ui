/**
 * NotificationPreferencesPage — PracticaYoruba
 * UC-NOT-06: Gestionar preferencias de notificacion por email.
 *
 * Lectura inicial via Redux (`fetchNotificationPreferences`) y mutacion
 * con `updateNotificationPreferences`. Las preferencias `mandatory: true`
 * (UC-NOT-01/02 — confirmacion de orden, cambio de estado) no se pueden
 * desactivar.
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
  clearNotificationsActionState,
} from '@redux/slices/notificationsSlice';
import styles from './NotificationPreferencesPage.module.scss';

export default function NotificationPreferencesPage() {
  const dispatch = useDispatch();
  const {
    preferences,
    isLoading,
    isActioning,
    error,
    actionError,
    lastAction,
  } = useSelector((s) => s.notifications);

  const [draft, setDraft] = useState([]);

  useEffect(() => {
    dispatch(fetchNotificationPreferences());
    return () => {
      dispatch(clearNotificationsActionState());
    };
  }, [dispatch]);

  useEffect(() => {
    setDraft(preferences);
  }, [preferences]);

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

      {error && (
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
