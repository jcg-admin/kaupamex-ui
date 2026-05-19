/**
 * AdminSystemSettingsPage — UC-ADM-04
 *
 * Formulario de configuracion del sistema (settings_app).
 *
 *   GET   /api/v1/admin/settings/
 *   PATCH /api/v1/admin/settings/
 *
 * Los campos expuestos son ortogonales: el admin edita lo que necesita
 * y se envia solo el delta via PATCH.
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  useSystemSettings, SYSTEM_SETTINGS_KEY,
} from '@hooks/domain/useSystemSettings';
import {
  updateSettings, clearSettingsActionState,
} from '@redux/slices/settingsSlice';
import styles from './AdminSystemSettingsPage.module.scss';

const FIELDS = [
  { key: 'site_name',        label: 'Nombre del sitio',         type: 'text' },
  { key: 'contact_email',    label: 'Email de contacto',        type: 'email' },
  { key: 'support_phone',    label: 'Telefono de soporte',      type: 'tel' },
  { key: 'tax_rate',         label: 'Tasa de IVA (%)',          type: 'number' },
  { key: 'currency',         label: 'Moneda',                   type: 'text' },
  { key: 'maintenance_mode', label: 'Modo mantenimiento',       type: 'checkbox' },
];

export default function AdminSystemSettingsPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.settings);
  const { data, isLoading, isError } = useSystemSettings();

  const [form, setForm] = useState({});

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked
            : type === 'number'   ? (value === '' ? '' : Number(value))
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateSettings(form));
    if (updateSettings.fulfilled.match(result)) {
      dispatch(clearSettingsActionState());
      queryClient.invalidateQueries({ queryKey: SYSTEM_SETTINGS_KEY });
    }
  };

  if (isLoading) return <p>Cargando configuracion…</p>;
  if (isError)   return <p role="alert">No se pudo cargar la configuracion.</p>;

  return (
    <section className={styles.page} aria-labelledby="settings-title">
      <header className={styles.header}>
        <h1 id="settings-title" className={styles.title}>
          Configuracion del Sistema
        </h1>
        <p className={styles.subtitle}>
          Ajustes globales del sitio.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        {FIELDS.map((f) => (
          <div key={f.key} className={styles.field}>
            <label htmlFor={`set-${f.key}`}>{f.label}</label>
            {f.type === 'checkbox' ? (
              <input
                id={`set-${f.key}`}
                name={f.key}
                type="checkbox"
                checked={Boolean(form[f.key])}
                onChange={handleChange}
              />
            ) : (
              <input
                id={`set-${f.key}`}
                name={f.key}
                type={f.type}
                value={form[f.key] ?? ''}
                onChange={handleChange}
              />
            )}
          </div>
        ))}

        {actionError && (
          <p role="alert" className={styles.apiError}>
            {actionError.message ?? 'No se pudo guardar la configuracion.'}
          </p>
        )}
        {lastAction === 'updated' && (
          <p role="status" className={styles.success}>
            Configuracion guardada correctamente.
          </p>
        )}

        <div className={styles.actions}>
          <button type="submit" disabled={isActioning}>
            Guardar cambios
          </button>
        </div>
      </form>
    </section>
  );
}
