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
            {groupA.length === 0 ? (
              <p className={styles.empty}>Sin ordenes pendientes de despacho.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Comprador</th>
                    <th>Pago confirmado</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {groupA.map((o) => (
                    <tr key={o.order_id}>
                      <td>{o.order_number}</td>
                      <td>{o.buyer_username}</td>
                      <td>{formatDate(o.created_at)}</td>
                      <td>
                        <Link
                          to={`/admin/orders/${o.order_id}`}
                          className={styles.actionLink}
                        >
                          Crear guia
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className={styles.group} aria-labelledby="group-b-title">
            <h2 id="group-b-title">En transito</h2>
            <p className={styles.meta}>
              Guias activas con ultimo evento del courier (UC-LOG-02 / UC-LOG-03 / UC-LOG-05).
            </p>
            {groupB.length === 0 ? (
              <p className={styles.empty}>Sin envios en transito.</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Orden</th>
                    <th>Courier</th>
                    <th>Tracking</th>
                    <th>Ultimo estado</th>
                    <th>Fecha</th>
                    <th>Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {groupB.map((g) => (
                    <tr key={g.guide_id}>
                      <td>{g.order_number}</td>
                      <td>{g.courier_name}</td>
                      <td>{g.tracking_number ?? '—'}</td>
                      <td>{g.last_status}</td>
                      <td>{formatDate(g.last_event_at)}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelivery(g.guide_id)}
                          disabled={isActioning}
                          className={styles.actionBtn}
                        >
                          Confirmar entrega
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </section>
  );
}
