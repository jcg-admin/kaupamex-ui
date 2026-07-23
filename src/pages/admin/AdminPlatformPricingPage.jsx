/**
 * AdminPlatformPricingPage — Consola L0 del operador Kaupamex: catálogo de
 * tarifas (UC-PLT-18, mockup-catalogo-tarifas-kaupamex).
 *
 * El operador siembra/versiona el precio por módulo × ciclo. Lo que se siembra
 * aquí es lo que una suscripción congela al contratar (DEC-T6,
 * CompanyModuleSubscription.apply_current_price). La pantalla de provisión
 * (UC-PLT-05) elige el ciclo; el importe se fija aquí.
 *
 * Contrato (api /api/v2/platform/module-prices/):
 *   GET    /                    catálogo (platform.view)
 *   POST   /                    alta de tarifa (platform.provision)
 *   DELETE /<id>/               baja de una versión de tarifa
 */
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';
import {
  useModulePrices,
  usePlatformModules,
  PLATFORM_PRICES_QUERY_KEY,
} from '@hooks/domain/usePlatformProvision';
import { DataTable } from '@components/common';
import { MetaTag, Field, Select, Button, Card } from '@components/common/primitives';
import Alert from '@components/common/Alert/Alert';
import styles from './AdminPlatformPricingPage.module.scss';

const PRICES_URL = '/api/v2/platform/module-prices/';

const CYCLES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
];
const CYCLE_LABEL = { monthly: 'Mensual', annual: 'Anual' };

const EMPTY_FORM = {
  module: '', billing_cycle: 'monthly', price: '', currency: 'MXN', effective_from: '',
};

export default function AdminPlatformPricingPage() {
  const qc = useQueryClient();
  const prices = useModulePrices();
  const modules = usePlatformModules();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Sólo los módulos vendibles (is_application) son tarifables.
  const moduleOptions = useMemo(
    () => (modules.data || [])
      .filter((m) => m.is_application)
      .map((m) => ({ value: String(m.id), label: m.name })),
    [modules.data],
  );

  const invalidate = () => qc.invalidateQueries({ queryKey: PLATFORM_PRICES_QUERY_KEY });

  async function onCreate(e) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await apiService.post(PRICES_URL, {
        module: Number(form.module),
        billing_cycle: form.billing_cycle,
        price: form.price,
        currency: form.currency.trim() || 'MXN',
        effective_from: form.effective_from || undefined,
      });
      await invalidate();
      setForm(EMPTY_FORM);
      setCreating(false);
      setFeedback({ variant: 'success', text: 'Tarifa sembrada.' });
    } catch (err) {
      const detail = err?.data?.price?.[0] || err?.data?.detail || err?.message
        || 'No se pudo guardar la tarifa.';
      setFeedback({ variant: 'danger', text: String(detail) });
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row) {
    setBusy(true);
    setFeedback(null);
    try {
      await apiService.delete(`${PRICES_URL}${row.id}/`);
      await invalidate();
      setFeedback({ variant: 'success', text: 'Tarifa eliminada.' });
    } catch (err) {
      setFeedback({ variant: 'danger', text: err?.message || 'No se pudo eliminar.' });
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: 'module_code', header: 'Módulo', sortable: true },
    {
      key: 'billing_cycle', header: 'Ciclo',
      render: (r) => CYCLE_LABEL[r.billing_cycle] || r.billing_cycle,
    },
    { key: 'price', header: 'Precio', align: 'right' },
    { key: 'currency', header: 'Moneda' },
    {
      key: 'effective_from', header: 'Desde',
      render: (r) => (r.effective_from ? new Date(r.effective_from).toLocaleDateString('es-MX') : '—'),
    },
    {
      key: 'effective_to', header: 'Hasta',
      render: (r) => (r.effective_to ? new Date(r.effective_to).toLocaleDateString('es-MX') : '—'),
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onDelete(r)}>
          Eliminar
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <MetaTag tone="bronze">Kaupamex · Operador L0</MetaTag>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tarifas de módulos</h1>
          <p className={styles.lead}>
            Precio por módulo y ciclo. Una suscripción congela la tarifa vigente
            al contratar. La escritura requiere <code>platform.provision</code>.
          </p>
        </div>
        <Button variant="primary" onClick={() => { setCreating((v) => !v); setFeedback(null); }}>
          + Nueva tarifa
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.variant} dismissible onClosed={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      {creating && (
        <Card title="Nueva tarifa" className={styles.card}>
          <form onSubmit={onCreate} className={styles.createForm}>
            <Select label="Módulo" name="module" required
              value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })}
              placeholder={modules.isLoading ? 'Cargando…' : 'Selecciona un módulo'}
              options={moduleOptions} />
            <Select label="Ciclo" name="billing_cycle" required
              value={form.billing_cycle}
              onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
              options={CYCLES} />
            <Field label="Precio" name="price" type="number" required
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="199.00" />
            <Field label="Moneda" name="currency"
              value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
              placeholder="MXN" />
            <label className={styles.dateField}>
              <span className={styles.dateLabel}>Vigente desde</span>
              <input type="date" name="effective_from" className={styles.dateInput}
                value={form.effective_from}
                onChange={(e) => setForm({ ...form, effective_from: e.target.value })}
                aria-label="Vigente desde" />
            </label>
            <div className={styles.formActions}>
              <Button type="submit" variant="primary"
                disabled={busy || !form.module || !form.price.trim()}>
                {busy ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button type="button" variant="secondary" disabled={busy}
                onClick={() => { setCreating(false); setForm(EMPTY_FORM); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <DataTable
        caption="Catálogo de tarifas de módulos"
        columns={columns}
        rows={prices.data || []}
        rowKey={(r) => r.id}
        loading={prices.isLoading}
        emptyText="Aún no hay tarifas sembradas (los módulos se contratan gratis)."
      />
    </div>
  );
}
