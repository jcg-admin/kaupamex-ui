/**
 * AdminShippingZonesPage — PracticaYoruba
 * H-12: catálogo de zonas de envío + tiempos de entrega.
 *
 * Lista, crea, edita y desactiva zonas (nombre, prefijo de CP, ventana de
 * días hábiles de entrega y costo opcional). Consume el CRUD admin en
 * /api/v2/admin/shipping-zones/ (ShippingZoneViewSet).
 */
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';
import { useShippingZones, SHIPPING_ZONES_QUERY_KEY } from '@hooks/domain/useShippingZones';
import { MetaTag, Button, Card } from '@components/common/primitives';
import { DataTable } from '@components/common/DataTable/DataTable';
import ConfirmDialog from '@components/common/ConfirmDialog/ConfirmDialog';
import Icon from '@components/common/Icon/Icon';
import styles from './AdminShippingZonesPage.module.scss';

const BASE_URL = '/api/v2/admin/shipping-zones/';
const EMPTY = { name: '', zip_code_prefix: '', estimated_days_min: '', estimated_days_max: '', cost: '' };

function etaLabel(z) {
  if (z.estimated_days_min && z.estimated_days_max) return `${z.estimated_days_min}–${z.estimated_days_max} días`;
  if (z.estimated_days_min) return `desde ${z.estimated_days_min} días`;
  if (z.estimated_days_max) return `hasta ${z.estimated_days_max} días`;
  return '—';
}

export default function AdminShippingZonesPage() {
  const queryClient = useQueryClient();
  const { data: zones = [], isLoading, isError } = useShippingZones();

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSaving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const refresh = () => queryClient.invalidateQueries({ queryKey: SHIPPING_ZONES_QUERY_KEY });

  const startCreate = () => { setEditingId(null); setForm(EMPTY); setErrors({}); setSubmitError(null); };
  const startEdit = (z) => {
    setEditingId(z.id);
    setForm({
      name: z.name ?? '',
      zip_code_prefix: z.zip_code_prefix ?? '',
      estimated_days_min: z.estimated_days_min ?? '',
      estimated_days_max: z.estimated_days_max ?? '',
      cost: z.cost ?? '',
    });
    setErrors({});
    setSubmitError(null);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!String(form.zip_code_prefix).trim()) e.zip_code_prefix = 'El prefijo de CP es obligatorio.';
    const lo = form.estimated_days_min === '' ? null : Number(form.estimated_days_min);
    const hi = form.estimated_days_max === '' ? null : Number(form.estimated_days_max);
    if (lo !== null && hi !== null && hi < lo) e.estimated_days_max = 'El máximo no puede ser menor que el mínimo.';
    return e;
  };

  const buildPayload = () => {
    const p = {
      name: form.name.trim(),
      zip_code_prefix: String(form.zip_code_prefix).trim(),
    };
    p.estimated_days_min = form.estimated_days_min === '' ? null : Number(form.estimated_days_min);
    p.estimated_days_max = form.estimated_days_max === '' ? null : Number(form.estimated_days_max);
    p.cost = form.cost === '' ? null : Number(form.cost);
    return p;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSaving(true);
    setSubmitError(null);
    try {
      if (editingId) await apiService.patch(`${BASE_URL}${editingId}/`, buildPayload());
      else await apiService.post(BASE_URL, buildPayload());
      await refresh();
      startCreate();
    } catch (err) {
      setSubmitError(err?.response?.data?.detail || err?.message || 'No se pudo guardar la zona.');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await apiService.delete(`${BASE_URL}${pendingDelete.id}/`);
      await refresh();
    } finally {
      setPendingDelete(null);
    }
  };

  const columns = [
    { key: 'name', header: 'Zona', render: (z) => z.name },
    { key: 'zip', header: 'Prefijo CP', render: (z) => z.zip_code_prefix },
    { key: 'eta', header: 'Entrega', render: etaLabel },
    { key: 'cost', header: 'Costo', render: (z) => (z.cost != null ? `$${z.cost}` : 'del método') },
    {
      key: 'active', header: 'Estado',
      render: (z) => (z.is_active ? 'Activa' : 'Inactiva'),
    },
    {
      key: 'actions', header: '',
      render: (z) => (
        <div className={styles.rowActions}>
          <button type="button" className={styles.actionBtn} onClick={() => startEdit(z)} title="Editar" aria-label="Editar"><Icon name="pencil" size={16} /></button>
          <button type="button" className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => setPendingDelete(z)} title="Desactivar" aria-label="Desactivar"><Icon name="x" size={16} /></button>
        </div>
      ),
    },
  ];

  const field = (name, id) => ({
    id, name, value: form[name],
    onChange: (e) => {
      setForm((p) => ({ ...p, [name]: e.target.value }));
      if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
    },
    className: errors[name] ? `${styles.input} ${styles.inputError}` : styles.input,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${id}-error` : undefined,
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Envíos · {zones.length} zonas</MetaTag>
          <h1 className={styles.title}>Zonas de entrega</h1>
        </div>
      </header>

      <Card
        as="form"
        onSubmit={handleSubmit}
        noValidate
        title={editingId ? 'Editar zona' : 'Nueva zona'}
        footer={(
          <>
            {editingId && <Button type="button" variant="secondary" onClick={startCreate}>Cancelar</Button>}
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear zona'}
            </Button>
          </>
        )}
      >
        <div className={styles.grid}>
          <div className={styles.fieldBlock}>
            <label htmlFor="zone-name" className={styles.label}>Nombre <span className={styles.required} aria-hidden="true">*</span></label>
            <input {...field('name', 'zone-name')} type="text" aria-required />
            {errors.name && <p id="zone-name-error" className={styles.fieldError}>{errors.name}</p>}
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="zone-zip" className={styles.label}>Prefijo CP <span className={styles.required} aria-hidden="true">*</span></label>
            <input {...field('zip_code_prefix', 'zone-zip')} type="text" maxLength={5} aria-required />
            {errors.zip_code_prefix && <p id="zone-zip-error" className={styles.fieldError}>{errors.zip_code_prefix}</p>}
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="zone-min" className={styles.label}>Días mín.</label>
            <input {...field('estimated_days_min', 'zone-min')} type="number" min="1" />
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="zone-max" className={styles.label}>Días máx.</label>
            <input {...field('estimated_days_max', 'zone-max')} type="number" min="1" />
            {errors.estimated_days_max && <p id="zone-max-error" className={styles.fieldError}>{errors.estimated_days_max}</p>}
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="zone-cost" className={styles.label}>Costo (opcional)</label>
            <input {...field('cost', 'zone-cost')} type="number" step="0.01" min="0" placeholder="usar el del método" />
          </div>
        </div>
        {submitError && <p role="alert" className={styles.apiError}>{submitError}</p>}
      </Card>

      {isError && <p role="alert" className={styles.apiError}>No se pudieron cargar las zonas.</p>}

      <div className={styles.tableWrap}>
        <DataTable
          columns={columns}
          rows={zones}
          rowKey={(z) => z.id}
          loading={isLoading}
          loadingText="Cargando zonas…"
          emptyText="Aún no hay zonas de entrega"
          caption="Zonas de entrega"
        />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Desactivar zona"
        message={<>¿Desactivar la zona <strong>{pendingDelete?.name}</strong> ({pendingDelete?.zip_code_prefix})?</>}
        confirmLabel="Desactivar"
        tone="danger"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
