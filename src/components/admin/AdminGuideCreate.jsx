/**
 * AdminGuideCreate — UC-LOG-01 / UC-LOG-02
 *
 * Gestión de la guía de envío de una orden desde el detalle admin del pedido.
 * Si la orden aún no tiene guía muestra el formulario de creación (COV-04a);
 * si ya existe, muestra su estado y permite avanzarlo / actualizar el rastreo
 * (register-tracking). Todo por order_number (la UI no conoce el pk).
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCouriers, fetchOrderGuide, createShipmentGuide, updateGuide, cancelGuide,
  clearLogisticsActionState,
} from '@redux/slices/logisticsSlice';
import { Card, Field, Button } from '@components/common/primitives';
import ConfirmDialog from '@components/common/ConfirmDialog/ConfirmDialog';
import styles from './AdminGuideCreate.module.scss';

const STATUS_LABEL = {
  CREATED: 'Guía creada', PICKED_UP: 'Recolectado', IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado', INCIDENT: 'Incidencia', CANCELLED: 'Cancelado',
};
// El avance de estado NO incluye CANCELLED: cancelar usa el endpoint dedicado
// `/cancel/` (soft-delete), no un simple PATCH de estado.
const STATUS_OPTIONS = ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'];

export default function AdminGuideCreate({ orderNumber }) {
  const dispatch = useDispatch();
  const couriers = useSelector((s) => s.logistics?.couriers ?? []);
  const isActioning = useSelector((s) => s.logistics?.isActioning);

  const [guide, setGuide] = useState(null);
  const [courierId, setCourierId] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    dispatch(fetchCouriers());
    dispatch(fetchOrderGuide(orderNumber)).then((res) => {
      if (fetchOrderGuide.fulfilled.match(res) && res.payload) setGuide(res.payload);
    });
    return () => { dispatch(clearLogisticsActionState()); };
  }, [dispatch, orderNumber]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(null);
    if (!courierId) { setError('Selecciona un courier.'); return; }
    if (!tracking.trim()) { setError('El número de rastreo es obligatorio.'); return; }
    const res = await dispatch(createShipmentGuide({
      orderNumber, courierId: Number(courierId), trackingNumber: tracking.trim(), notes: notes.trim(),
    }));
    if (createShipmentGuide.fulfilled.match(res)) {
      setGuide(res.payload);
      setNotice('Guía creada.');
    } else {
      setError(res.payload?.detail || res.payload?.message || 'No se pudo crear la guía.');
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setError(null); setNotice(null);
    const res = await dispatch(updateGuide({ guideId: guide.id, status: newStatus }));
    if (updateGuide.fulfilled.match(res)) {
      setGuide(res.payload);
      setNewStatus('');
      setNotice('Estado actualizado.');
    } else {
      setError(res.payload?.detail || res.payload?.message || 'No se pudo actualizar el estado.');
    }
  };

  const handleCancelGuide = async () => {
    setError(null); setNotice(null);
    const res = await dispatch(cancelGuide(guide.id));
    setConfirmCancel(false);
    if (cancelGuide.fulfilled.match(res)) {
      setGuide({ ...guide, status: 'CANCELLED' });
      setNotice('Guía cancelada.');
    } else {
      setError(res.payload?.detail || res.payload?.message || 'No se pudo cancelar la guía.');
    }
  };

  // --- Guía existente: gestión de estado ---
  if (guide) {
    const isClosed = guide.status === 'DELIVERED' || guide.status === 'CANCELLED';
    return (
      <Card title="Guía de envío">
        <dl className={styles.summary}>
          <dt>Paquetería</dt><dd>{guide.courier?.name || '—'}</dd>
          <dt>Rastreo</dt><dd>{guide.tracking_number}</dd>
          <dt>Estado</dt><dd>{STATUS_LABEL[guide.status] || guide.status}</dd>
        </dl>
        {!isClosed && (
          <div className={styles.grid}>
            <label className={styles.field}>
              <span className={styles.label}>Avanzar estado</span>
              <select className={styles.select} value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">— Selecciona —</option>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </label>
            <div className={styles.inlineAction}>
              <Button type="button" variant="primary" onClick={handleUpdateStatus} disabled={isActioning || !newStatus}>
                {isActioning ? 'Actualizando…' : 'Actualizar estado'}
              </Button>
            </div>
          </div>
        )}
        {!isClosed && (
          <div className={styles.inlineAction}>
            <Button type="button" variant="danger" onClick={() => setConfirmCancel(true)} disabled={isActioning}>
              Cancelar guía
            </Button>
          </div>
        )}
        {notice && <p role="status" className={styles.ok}>{notice}</p>}
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <ConfirmDialog
          open={confirmCancel}
          title="Cancelar guía de envío"
          message="Esta acción cancela la guía y no se puede deshacer. ¿Continuar?"
          confirmLabel="Cancelar guía"
          cancelLabel="Volver"
          tone="danger"
          isBusy={isActioning}
          onConfirm={handleCancelGuide}
          onCancel={() => setConfirmCancel(false)}
        />
      </Card>
    );
  }

  // --- Sin guía: creación ---
  return (
    <Card as="form" onSubmit={handleCreate} noValidate title="Crear guía de envío"
      footer={<Button type="submit" variant="primary" disabled={isActioning}>
        {isActioning ? 'Creando…' : 'Crear guía'}
      </Button>}
    >
      <div className={styles.grid}>
        <label className={styles.field}>
          <span className={styles.label}>Courier <span className={styles.req} aria-hidden="true">*</span></span>
          <select
            className={styles.select}
            value={courierId}
            onChange={(e) => setCourierId(e.target.value)}
            aria-required
          >
            <option value="">— Selecciona —</option>
            {couriers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <Field
          label="Número de rastreo"
          name="tracking_number"
          required
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
        />
      </div>
      <Field
        label="Notas (opcional)"
        name="notes"
        textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </Card>
  );
}
