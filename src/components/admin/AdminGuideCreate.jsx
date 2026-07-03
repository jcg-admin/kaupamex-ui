/**
 * AdminGuideCreate — UC-LOG-01
 *
 * Formulario para crear la guía de envío de una orden IN_PREPARATION desde el
 * detalle admin del pedido. Cubre el hueco COV-04a: antes el panel prometía
 * "crear guías" pero no había UI (el botón era un Link muerto).
 *
 * POST /api/v2/logistics/guides/ { order_number, courier_id, tracking_number, notes? }
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCouriers, createShipmentGuide, clearLogisticsActionState,
} from '@redux/slices/logisticsSlice';
import { Card, Field, Button } from '@components/common/primitives';
import styles from './AdminGuideCreate.module.scss';

export default function AdminGuideCreate({ orderNumber }) {
  const dispatch = useDispatch();
  const couriers = useSelector((s) => s.logistics?.couriers ?? []);
  const isActioning = useSelector((s) => s.logistics?.isActioning);

  const [courierId, setCourierId] = useState('');
  const [tracking, setTracking] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    dispatch(fetchCouriers());
    return () => { dispatch(clearLogisticsActionState()); };
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!courierId) { setError('Selecciona un courier.'); return; }
    if (!tracking.trim()) { setError('El número de rastreo es obligatorio.'); return; }
    const res = await dispatch(createShipmentGuide({
      orderNumber, courierId: Number(courierId), trackingNumber: tracking.trim(), notes: notes.trim(),
    }));
    if (createShipmentGuide.fulfilled.match(res)) {
      setCreated(res.payload);
    } else {
      setError(res.payload?.detail || res.payload?.message || 'No se pudo crear la guía.');
    }
  };

  if (created) {
    return (
      <Card title="Guía de envío">
        <p className={styles.ok}>
          Guía creada con rastreo <strong>{created.tracking_number}</strong>
          {created.courier?.name ? ` · ${created.courier.name}` : ''}.
        </p>
      </Card>
    );
  }

  return (
    <Card as="form" onSubmit={handleSubmit} noValidate title="Crear guía de envío"
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
