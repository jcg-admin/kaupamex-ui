/**
 * ShipmentTracking — UC-LOG-06 (comprador)
 *
 * Muestra el estado de envío de un pedido: courier, número de rastreo, estado
 * y enlace de rastreo. Cubre COV-04b (el comprador no tenía visibilidad del
 * envío). Consulta GET /api/v2/logistics/buyer/orders/<order_number>/guide/;
 * si no hay guía todavía (404), no renderiza nada.
 */
import { useEffect, useState } from 'react';
import apiService from '@services/apiService';
import styles from './ShipmentTracking.module.scss';

const STATUS_LABEL = {
  CREATED:    'Guía creada',
  PICKED_UP:  'Recolectado',
  IN_TRANSIT: 'En tránsito',
  DELIVERED:  'Entregado',
  INCIDENT:   'Incidencia reportada',
  CANCELLED:  'Cancelado',
};

// Estados desde los que el comprador puede reportar un problema (el paquete ya
// salió) — debe coincidir con REPORTABLE_STATUSES del backend.
const REPORTABLE = new Set(['PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'INCIDENT']);

const PROBLEM_TYPES = [
  { value: 'NOT_RECEIVED',    label: 'No recibí el paquete' },
  { value: 'DAMAGED_PRODUCT', label: 'Producto dañado' },
  { value: 'WRONG_DELIVERY',  label: 'Entrega equivocada' },
  { value: 'DELAY',           label: 'Retraso en la entrega' },
];
const MIN_DESC = 20;

export default function ShipmentTracking({ orderNumber }) {
  const [guide, setGuide] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [problemType, setProblemType] = useState('NOT_RECEIVED');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiService
      .get(`/api/v2/logistics/buyer/orders/${orderNumber}/guide/`)
      .then(({ data }) => { if (!cancelled) setGuide(data); })
      .catch(() => { /* 404 = sin guía aún; no mostrar nada */ });
    return () => { cancelled = true; };
  }, [orderNumber]);

  const submitIncident = async (e) => {
    e.preventDefault();
    setError(null);
    if (description.trim().length < MIN_DESC) {
      setError(`Describe el problema con al menos ${MIN_DESC} caracteres.`);
      return;
    }
    setSubmitting(true);
    try {
      await apiService.post(`/api/v2/logistics/buyer/orders/${orderNumber}/incident/`, {
        problem_type: problemType,
        description: description.trim(),
      });
      setReported(true);
      setShowForm(false);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'No se pudo enviar el reporte.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!guide) return null;
  const canReport = REPORTABLE.has(guide.status);

  return (
    <section className={styles.card} aria-labelledby="ship-title">
      <h2 id="ship-title" className={styles.title}>Envío</h2>
      <dl className={styles.grid}>
        <dt>Paquetería</dt><dd>{guide.courier_name || '—'}</dd>
        <dt>Estado</dt><dd>{STATUS_LABEL[guide.status] || guide.status}</dd>
        <dt>Rastreo</dt>
        <dd>
          {guide.tracking_url ? (
            <a href={guide.tracking_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
              {guide.tracking_number} ↗
            </a>
          ) : (guide.tracking_number || '—')}
        </dd>
        {guide.estimated_delivery && (
          <>
            <dt>Entrega estimada</dt>
            <dd>{new Date(guide.estimated_delivery).toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}</dd>
          </>
        )}
      </dl>
      {guide.last_event?.description && (
        <p className={styles.lastEvent}>{guide.last_event.description}</p>
      )}

      {reported && (
        <p role="status" className={styles.reported}>
          Reporte enviado. Nuestro equipo revisará tu envío.
        </p>
      )}

      {canReport && !reported && !showForm && (
        <button type="button" className={styles.reportBtn} onClick={() => setShowForm(true)}>
          Reportar un problema
        </button>
      )}

      {showForm && !reported && (
        <form className={styles.reportForm} onSubmit={submitIncident} noValidate>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Tipo de problema</span>
            <select
              className={styles.select}
              value={problemType}
              onChange={(e) => setProblemType(e.target.value)}
            >
              {PROBLEM_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Descripción</span>
            <textarea
              className={styles.textarea}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuéntanos qué pasó (mínimo 20 caracteres)."
            />
          </label>
          {error && <p role="alert" className={styles.reportError}>{error}</p>}
          <div className={styles.reportActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={submitting}>
              {submitting ? 'Enviando…' : 'Enviar reporte'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
