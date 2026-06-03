/**
 * AdminLogisticsPage — UC-LOG-08
 *
 *   GET  /api/v1/logistics/                                — panel de envios
 *   POST /api/v1/logistics/guides/:guideId/confirm-delivery/  — UC-LOG-05
 *
 * Punto de entrada operacional del backoffice de logistica. Presenta
 * dos grupos de trabajo:
 *
 *   - Grupo A: ordenes en PAGO_CONFIRMADO / EN_PREPARACION sin
 *     ShipmentGuide — accion «Crear guia» (UC-LOG-01).
 *   - Grupo B: ShipmentGuide activas no entregadas con su ultimo
 *     evento — acciones «Confirmar entrega» (UC-LOG-05) y enlace al
 *     detalle de la orden.
 *
 * Identificadores y campos en ingles (DEC-DOC-005); textos UI en espanol.
 */
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { useLogistics, LOGISTICS_KEY } from '@hooks/domain/useLogistics';
import {
  confirmDelivery, clearLogisticsActionState,
} from '@redux/slices/logisticsSlice';
import { DataTable } from '@components/common/DataTable/DataTable';
import styles from './AdminLogisticsPage.module.scss';

function formatDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('es-MX'); }
  catch { return iso; }
}

export default function AdminLogisticsPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const { isActioning, actionError, lastAction } = useSelector((s) => s.logistics);
  const { data, isLoading, isError } = useLogistics();

  const groupA = data?.group_a ?? [];
  const groupB = data?.group_b ?? [];

  const handleConfirmDelivery = async (guideId) => {
    const result = await dispatch(confirmDelivery(guideId));
    if (confirmDelivery.fulfilled.match(result)) {
      dispatch(clearLogisticsActionState());
      queryClient.invalidateQueries({ queryKey: LOGISTICS_KEY });
    }
  };

  // Columnas DataTable (T-04) — Grupo A (pendientes de despacho).
  // Preserva las 4 columnas y la accion «Crear guia» de la tabla cruda.
  const groupAColumns = [
    { key: 'order_number', header: 'Orden', sortable: true },
    {
      key: 'recipient',
      header: 'Comprador',
      // H-CICLO36-03: API devuelve recipient_name/city (no buyer_username)
      value: (o) => o.recipient_name ?? '',
      render: (o) => `${o.recipient_name ?? '—'}${o.city ? ` — ${o.city}` : ''}`,
    },
    {
      key: 'confirmed_at',
      header: 'Pago confirmado',
      sortable: true,
      value: (o) => new Date(o.estimated_delivery ?? o.created_at).getTime(),
      render: (o) => formatDate(o.estimated_delivery ?? o.created_at),
    },
    {
      key: 'action',
      header: 'Accion',
      filterable: false,
      render: (o) => (
        <Link to={`/admin/orders/${o.order_id}`} className={styles.actionLink}>
          Crear guia
        </Link>
      ),
    },
  ];

  // Columnas DataTable (T-04) — Grupo B (en transito).
  const groupBColumns = [
    { key: 'order_number', header: 'Orden', sortable: true },
    // H-CICLO36-03: API devuelve courier_code (no courier_name)
    { key: 'courier_code', header: 'Courier', sortable: true, render: (g) => g.courier_code ?? '—' },
    { key: 'tracking_number', header: 'Tracking', render: (g) => g.tracking_number ?? '—' },
    // H-CICLO36-03: API devuelve status (no last_status)
    { key: 'status', header: 'Ultimo estado', sortable: true, render: (g) => g.status ?? '—' },
    // H-CICLO36-03: la respuesta del panel no incluye last_event_at
    { key: 'event_at', header: 'Fecha', filterable: false, render: () => '—' },
    {
      key: 'action',
      header: 'Accion',
      filterable: false,
      render: (g) => (
        <button
          type="button"
          onClick={() => handleConfirmDelivery(g.guide_id)}
          disabled={isActioning}
          className={styles.actionBtn}
        >
          Confirmar entrega
        </button>
      ),
    },
  ];

  return (
    <section className={styles.page} aria-labelledby="logistics-title">
      <header className={styles.header}>
        <h1 id="logistics-title" className={styles.title}>Logistica</h1>
        <p className={styles.subtitle}>
          Panel operacional de envios — punto de entrada para crear
          guias, registrar rastreos y confirmar entregas.
        </p>
      </header>

      {actionError && (
        <p role="alert" className={styles.apiError}>
          {actionError.message ?? 'No se pudo completar la accion.'}
        </p>
      )}
      {lastAction === 'delivery_confirmed' && (
        <p role="status" className={styles.success}>
          Entrega confirmada correctamente.
        </p>
      )}

      {isLoading && <p>Cargando panel…</p>}
      {isError   && <p role="alert">No se pudo cargar el panel de logistica.</p>}

      {!isLoading && !isError && groupA.length === 0 && groupB.length === 0 && (
        <p className={styles.empty}>No hay envios pendientes de atencion.</p>
      )}

      {!isLoading && !isError && (groupA.length > 0 || groupB.length > 0) && (
        <>
          <section className={styles.group} aria-labelledby="group-a-title">
            <h2 id="group-a-title">Pendientes de despacho</h2>
            <p className={styles.meta}>
              Ordenes pagadas sin guia de envio creada (UC-LOG-01).
            </p>
            <DataTable
              columns={groupAColumns}
              rows={groupA}
              emptyText="Sin ordenes pendientes de despacho."
              rowKey={(o) => o.order_id}
              caption="Ordenes pendientes de despacho"
            />
          </section>

          <section className={styles.group} aria-labelledby="group-b-title">
            <h2 id="group-b-title">En transito</h2>
            <p className={styles.meta}>
              Guias activas con ultimo evento del courier (UC-LOG-02 / UC-LOG-03 / UC-LOG-05).
            </p>
            <DataTable
              columns={groupBColumns}
              rows={groupB}
              emptyText="Sin envios en transito."
              rowKey={(g) => g.guide_id}
              caption="Guias activas en transito"
            />
          </section>
        </>
      )}
    </section>
  );
}
