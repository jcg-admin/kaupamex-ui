/**
 * ShipmentQuoter — cotizador de paqueterías (admin, UC-LOG-09).
 *
 * Consume POST /api/v2/shipping-offers (ShipmentOffersView, admin-only,
 * logistics.manage). El administrador ingresa un paquete (dimensiones/peso/
 * valor) y ve las paqueterías **elegibles rankeadas** (costo → tránsito →
 * ambiental) más las **inelegibles** con su motivo. La elección de paquetería
 * es decisión del administrador (D-5), no del comprador.
 *
 * Primitivos nativos reutilizados (regla adaptacion-componentes-nativa):
 *   NumericTextBox · Checkbox · DataTable · Alert · LoadingButton.
 */
import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchShipmentOffers,
  clearShipmentOffers,
} from '@redux/slices/logisticsSlice';
import NumericTextBox from '@components/common/NumericTextBox/NumericTextBox';
import Checkbox       from '@components/common/Checkbox/Checkbox';
import { DataTable }  from '@components/common/DataTable/DataTable';
import Alert          from '@components/common/Alert/Alert';
import LoadingButton  from '@components/common/LoadingButton/LoadingButton';
import { formatCurrency } from '@lib/intl';
import styles from './ShipmentQuoter.module.scss';

const FIELDS = [
  { key: 'weight', label: 'Peso (kg)' },
  { key: 'length', label: 'Largo (cm)' },
  { key: 'width',  label: 'Ancho (cm)' },
  { key: 'height', label: 'Alto (cm)' },
  { key: 'value',  label: 'Valor declarado' },
];

const money = (n) => {
  try { return formatCurrency(Number(n)); } catch { return `$${n}`; }
};

const OFFER_COLUMNS = [
  { key: 'carrier',      header: 'Paquetería', sortable: true,
    render: (o) => o.carrier },
  { key: 'total_cost',   header: 'Costo', sortable: true,
    render: (o) => money(o.total_cost) },
  { key: 'transit_days', header: 'Tránsito (días)', sortable: true,
    render: (o) => o.transit_days ?? '—' },
  { key: 'environmental', header: 'Ambiental', sortable: true,
    render: (o) => (o.environmental != null ? String(o.environmental) : '—') },
  { key: 'rationale',    header: 'Detalle',
    render: (o) => o.rationale ?? '—' },
];

export default function ShipmentQuoter() {
  const dispatch = useDispatch();
  const { offers, ineligible, quoting, quoteError } = useSelector((s) => s.logistics);
  const [form, setForm] = useState({
    weight: '1', length: '20', width: '15', height: '10', value: '100',
  });
  const [hazardous, setHazardous] = useState(false);

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = useCallback((e) => {
    e.preventDefault();
    const pkg = {
      length: Number(form.length),
      width:  Number(form.width),
      height: Number(form.height),
      weight: Number(form.weight),
      value:  Number(form.value),
      hazardous,
    };
    dispatch(fetchShipmentOffers({ packages: [pkg] }));
  }, [dispatch, form, hazardous]);

  const onClear = () => dispatch(clearShipmentOffers());
  const hasResult = offers.length > 0 || ineligible.length > 0;

  return (
    <section className={styles.quoter} aria-labelledby="quoter-title">
      <h2 id="quoter-title" className={styles.title}>Cotizador de paqueterías</h2>
      <p className={styles.meta}>
        Ingresa un paquete y compara las paqueterías elegibles rankeadas por
        costo, tránsito y huella ambiental (UC-LOG-09).
      </p>

      <form onSubmit={onSubmit} className={styles.form} aria-label="Cotizar envío">
        <div className={styles.fields}>
          {FIELDS.map(({ key, label }) => (
            <label key={key} className={styles.field}>
              <span className={styles.fieldLabel}>{label}</span>
              <NumericTextBox
                value={form[key]}
                onChange={setField(key)}
                min={0}
                step={key === 'weight' ? 0.1 : 1}
                ariaLabel={label}
              />
            </label>
          ))}
        </div>
        <Checkbox
          checked={hazardous}
          onChange={(e) => setHazardous(e.target.checked)}
          label="Mercancía peligrosa"
        />
        <div className={styles.actions}>
          <LoadingButton type="submit" variant="primary" loading={quoting}>
            Cotizar
          </LoadingButton>
          {hasResult && (
            <button type="button" className={styles.clearBtn} onClick={onClear}>
              Limpiar
            </button>
          )}
        </div>
      </form>

      {quoteError && (
        <Alert variant="danger" role="alert">
          {quoteError.message || quoteError.code || 'No se pudo cotizar el envío.'}
        </Alert>
      )}

      {offers.length > 0 && (
        <div className={styles.result}>
          <h3 className={styles.resultTitle}>Paqueterías elegibles</h3>
          <DataTable
            columns={OFFER_COLUMNS}
            rows={offers}
            rowKey={(o, i) => `${o.carrier}-${i}`}
            emptyText="Sin paqueterías elegibles."
            caption="Paqueterías elegibles rankeadas"
          />
        </div>
      )}

      {ineligible.length > 0 && (
        <div className={styles.result}>
          <h3 className={styles.resultTitle}>No elegibles</h3>
          <ul className={styles.ineligible}>
            {ineligible.map((it, i) => (
              <li key={`${it.carrier}-${i}`}>
                <strong>{it.carrier}</strong>: {(it.reasons || []).join('; ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!quoting && !quoteError && !hasResult && (
        <p className={styles.empty}>Aún no has cotizado ningún envío.</p>
      )}
    </section>
  );
}
