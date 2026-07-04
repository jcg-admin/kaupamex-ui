/**
 * AdminSystemSettingsPage — UC-ADM-04
 *
 * Formulario de configuracion del sistema (settings_app).
 *
 *   GET   /api/v2/admin/settings/
 *   PATCH /api/v2/admin/settings/
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
import { Button } from '@components/common/primitives';
import styles from './AdminSystemSettingsPage.module.scss';

// H-CICLO40-08: claves alineadas con SiteSettingsAdminSerializer (UC-ADM-04).
// Claves anteriores incorrectas: contact_email (→support_email), support_phone
// (→phone), tax_rate (→iva_rate), maintenance_mode (campo inexistente en el
// modelo). Los campos mostraban siempre vacíos y los cambios se descartaban.
const FIELDS = [
  { key: 'site_name',               label: 'Nombre del sitio',         type: 'text' },
  { key: 'support_email',           label: 'Email de contacto',        type: 'email' },
  { key: 'phone',                   label: 'Teléfono de soporte',      type: 'tel' },
  { key: 'iva_rate',                label: 'Tasa de IVA (%)',          type: 'number' },
  { key: 'currency',                label: 'Moneda (ISO-4217)',        type: 'text' },
  { key: 'free_shipping_threshold', label: 'Umbral envío gratis (MXN)', type: 'number' },
  { key: 'min_stock_threshold',     label: 'Umbral de stock mínimo',   type: 'number' },
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
          <Button type="submit" variant="primary" disabled={isActioning}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </section>
  );
}
