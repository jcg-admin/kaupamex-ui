/**
 * AdminCouriersPage — PracticaYoruba (UC-LOG-01 soporte)
 *
 * Gestión del catálogo de paqueterías (couriers) que alimenta el selector de
 * creación de guías. Lista, crea, reactiva y desactiva couriers vía el CRUD
 * admin en /api/v2/logistics/couriers/ (CourierListCreateView / CourierDetailView).
 *
 * name y code son obligatorios y únicos; tracking_url_template es opcional y
 * admite el placeholder {tracking_number}. Desactivar es soft (is_active=false).
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCouriers, createCourier, updateCourier, deactivateCourier,
} from '@redux/slices/logisticsSlice';
import { MetaTag, Button, Card } from '@components/common/primitives';
import { DataTable } from '@components/common/DataTable/DataTable';
import ConfirmDialog from '@components/common/ConfirmDialog/ConfirmDialog';
import Icon from '@components/common/Icon/Icon';
import styles from './AdminShippingZonesPage.module.scss';

const EMPTY = { name: '', code: '', trackingUrlTemplate: '' };

export default function AdminCouriersPage() {
  const dispatch = useDispatch();
  const couriers = useSelector((s) => s.logistics?.couriers ?? []);
  const isActioning = useSelector((s) => s.logistics?.isActioning);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isLoading, setLoading] = useState(true);
  const [pendingDeactivate, setPendingDeactivate] = useState(null);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchCouriers()).then((res) => {
      if (fetchCouriers.rejected.match(res)) setLoadError(true);
      setLoading(false);
    });
  }, [dispatch]);

  const reset = () => { setForm(EMPTY); setErrors({}); setSubmitError(null); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!form.code.trim()) e.code = 'El código es obligatorio.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (Object.keys(v).length) { setErrors(v); return; }
    setSubmitError(null);
    const res = await dispatch(createCourier({
      name: form.name.trim(),
      code: form.code.trim(),
      trackingUrlTemplate: form.trackingUrlTemplate.trim(),
    }));
    if (createCourier.fulfilled.match(res)) {
      reset();
    } else {
      setSubmitError(res.payload?.detail || res.payload?.message || 'No se pudo crear la paquetería.');
    }
  };

  const handleReactivate = (c) => dispatch(updateCourier({ courierId: c.id, isActive: true }));

  const confirmDeactivate = async () => {
    await dispatch(deactivateCourier(pendingDeactivate.id));
    setPendingDeactivate(null);
  };

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

  const columns = [
    { key: 'name', header: 'Paquetería', render: (c) => c.name },
    { key: 'code', header: 'Código', render: (c) => c.code },
    {
      key: 'tracking', header: 'Rastreo',
      render: (c) => (c.tracking_url_template ? 'Configurado' : '—'),
    },
    {
      key: 'active', header: 'Estado',
      render: (c) => (c.is_active ? 'Activa' : 'Inactiva'),
    },
    {
      key: 'actions', header: '',
      render: (c) => (
        <div className={styles.rowActions}>
          {c.is_active ? (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionDelete}`}
              onClick={() => setPendingDeactivate(c)}
              title="Desactivar"
              aria-label="Desactivar"
              disabled={isActioning}
            ><Icon name="x" size={16} /></button>
          ) : (
            <Button type="button" variant="secondary" size="sm" onClick={() => handleReactivate(c)} disabled={isActioning}>
              Reactivar
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Envíos · {couriers.length} paqueterías</MetaTag>
          <h1 className={styles.title}>Paqueterías</h1>
        </div>
      </header>

      <Card
        as="form"
        onSubmit={handleSubmit}
        noValidate
        title="Nueva paquetería"
        footer={(
          <Button type="submit" variant="primary" disabled={isActioning}>
            {isActioning ? 'Guardando…' : 'Crear paquetería'}
          </Button>
        )}
      >
        <div className={styles.grid}>
          <div className={styles.fieldBlock}>
            <label htmlFor="courier-name" className={styles.label}>Nombre <span className={styles.required} aria-hidden="true">*</span></label>
            <input {...field('name', 'courier-name')} type="text" aria-required />
            {errors.name && <p id="courier-name-error" className={styles.fieldError}>{errors.name}</p>}
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="courier-code" className={styles.label}>Código <span className={styles.required} aria-hidden="true">*</span></label>
            <input {...field('code', 'courier-code')} type="text" maxLength={20} aria-required />
            {errors.code && <p id="courier-code-error" className={styles.fieldError}>{errors.code}</p>}
          </div>
          <div className={styles.fieldBlock}>
            <label htmlFor="courier-url" className={styles.label}>URL de rastreo (opcional)</label>
            <input {...field('trackingUrlTemplate', 'courier-url')} type="text" placeholder="https://…/{tracking_number}" />
          </div>
        </div>
        {submitError && <p role="alert" className={styles.apiError}>{submitError}</p>}
      </Card>

      {loadError && <p role="alert" className={styles.apiError}>No se pudieron cargar las paqueterías.</p>}

      <div className={styles.tableWrap}>
        <DataTable
          columns={columns}
          rows={couriers}
          rowKey={(c) => c.id}
          loading={isLoading}
          loadingText="Cargando paqueterías…"
          emptyText="Aún no hay paqueterías"
          caption="Paqueterías"
        />
      </div>

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Desactivar paquetería"
        message={pendingDeactivate ? `¿Desactivar "${pendingDeactivate.name}"? Dejará de aparecer al crear guías, pero podrás reactivarla.` : ''}
        confirmLabel="Desactivar"
        cancelLabel="Volver"
        tone="danger"
        isBusy={isActioning}
        onConfirm={confirmDeactivate}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
