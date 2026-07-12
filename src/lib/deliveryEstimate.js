/**
 * deliveryEstimate — formato y matching de la ventana "Recíbelo" (G-ENV-02).
 *
 * El API (PublicShippingZoneSerializer.delivery_estimate) entrega
 * `{ from: 'YYYY-MM-DD', to: 'YYYY-MM-DD', same_day: bool }` calculado con la
 * regla de corte 11:00 + días hábiles sin domingo. Aquí sólo formateamos e
 * identificamos la zona del C.P. — la regla de negocio vive en el backend.
 */
import { formatDate } from '@lib/intl';

// ISO 'YYYY-MM-DD' → Date en medianoche LOCAL (evita el corrimiento de un día
// que produce `new Date('YYYY-MM-DD')`, que interpreta la fecha como UTC).
function localDate(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * formatDeliveryLabel(estimate) → "Recíbelo el 9 jul" | "Recíbelo entre el 9 y
 * el 11 jul" | '' (si no hay estimación).
 */
export function formatDeliveryLabel(estimate) {
  const from = localDate(estimate?.from);
  if (!from) return '';
  const to = localDate(estimate?.to);
  const opts = { day: 'numeric', month: 'short' };
  if (estimate.same_day || !to || estimate.from === estimate.to) {
    return `Recíbelo el ${formatDate(from, opts)}`;
  }
  return `Recíbelo entre el ${formatDate(from, opts)} y el ${formatDate(to, opts)}`;
}

/**
 * matchZoneByCp(zones, zip) → la zona cuyo `zip_code_prefix` es prefijo del
 * C.P., prefiriendo el prefijo más largo (más específico). null si ninguna.
 */
export function matchZoneByCp(zones, zip) {
  const cp = String(zip || '').replace(/\D/g, '');
  if (!cp || !Array.isArray(zones)) return null;
  const matches = zones.filter(
    (z) => z && z.zip_code_prefix && cp.startsWith(String(z.zip_code_prefix)),
  );
  matches.sort(
    (a, b) => String(b.zip_code_prefix).length - String(a.zip_code_prefix).length,
  );
  return matches[0] || null;
}
