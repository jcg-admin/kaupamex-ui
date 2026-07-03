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

export default function ShipmentTracking({ orderNumber }) {
  const [guide, setGuide] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiService
      .get(`/api/v2/logistics/buyer/orders/${orderNumber}/guide/`)
      .then(({ data }) => { if (!cancelled) setGuide(data); })
      .catch(() => { /* 404 = sin guía aún; no mostrar nada */ });
    return () => { cancelled = true; };
  }, [orderNumber]);

  if (!guide) return null;

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
    </section>
  );
}
