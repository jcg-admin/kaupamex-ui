/**
 * AdminPlatformBillingPage — Consola de facturación L0 del operador Kaupamex
 * (UC-PLT-18 §7C, "cobro por lo suscrito", slice 4).
 *
 * El operador L0 ejecuta la corrida de cobro del período (emite las facturas de
 * suscripción company→Kaupamex), revisa el historial de corridas, y por empresa
 * inspecciona sus facturas y reintenta las que fallaron el cobro.
 *
 * Contrato (api /api/v2/platform/):
 *   GET   billing/runs/                 historial de corridas (platform.view)
 *   POST  billing/runs/                 ejecuta corrida del período -> 202 (platform.billing)
 *   GET   companies/<id>/invoices/      facturas de la empresa (platform.view)
 *   POST  invoices/<id>/retry/          reintenta una factura failed (platform.billing);
 *                                       503 GATEWAY_NOT_CONFIGURED si el cobro MP no está cableado
 */
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';
import {
  usePlatformBillingRuns,
  useCompanyInvoices,
  PLATFORM_BILLING_RUNS_QUERY_KEY,
  PLATFORM_INVOICES_QUERY_KEY,
} from '@hooks/domain/usePlatformBilling';
import { usePlatformCompanies } from '@hooks/domain/usePlatformProvision';
import { DataTable } from '@components/common';
import { MetaTag, Select, Button } from '@components/common/primitives';
import Badge from '@components/common/Badge/Badge';
import Alert from '@components/common/Alert/Alert';
import styles from './AdminPlatformBillingPage.module.scss';

const RUNS_URL = '/api/v2/platform/billing/runs/';
const INVOICE_RETRY_URL = (id) => `/api/v2/platform/invoices/${id}/retry/`;

const TRIGGER = { time: 'Programada', operator: 'Manual' };

const INVOICE_STATUS = {
  draft:  { label: 'Borrador',      theme: 'secondary' },
  issued: { label: 'Emitida',       theme: 'info' },
  paid:   { label: 'Pagada',        theme: 'success' },
  failed: { label: 'Cobro fallido', theme: 'error' },
  void:   { label: 'Anulada',       theme: 'secondary' },
};

const money = (amount, currency) =>
  amount == null ? '—' : `${amount} ${currency || ''}`.trim();
const shortDate = (v) => (v ? new Date(v).toLocaleString('es-MX') : '—');

export default function AdminPlatformBillingPage() {
  const qc = useQueryClient();
  const runs = usePlatformBillingRuns();
  const companies = usePlatformCompanies();
  const [companyId, setCompanyId] = useState('');
  const invoices = useCompanyInvoices(companyId);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { variant, text }

  const companyOptions = useMemo(() => {
    const list = companies.data || [];
    return [
      { value: '', label: '— Elegir empresa —' },
      ...list.map((c) => ({ value: String(c.id), label: `${c.name} (${c.code})` })),
    ];
  }, [companies.data]);

  const invalidateRuns = () =>
    qc.invalidateQueries({ queryKey: PLATFORM_BILLING_RUNS_QUERY_KEY });
  const invalidateInvoices = () =>
    qc.invalidateQueries({ queryKey: PLATFORM_INVOICES_QUERY_KEY });

  async function onRunBilling() {
    setBusy(true);
    setFeedback(null);
    try {
      await apiService.post(RUNS_URL);
      await invalidateRuns();
      setFeedback({ variant: 'success', text: 'Corrida de facturación ejecutada.' });
    } catch (err) {
      const detail = err?.data?.detail || err?.message || 'No se pudo ejecutar la corrida.';
      setFeedback({ variant: 'danger', text: String(detail) });
    } finally {
      setBusy(false);
    }
  }

  async function onRetry(invoice) {
    setBusy(true);
    setFeedback(null);
    try {
      await apiService.post(INVOICE_RETRY_URL(invoice.id));
      await invalidateInvoices();
      setFeedback({ variant: 'success', text: `Factura #${invoice.id} cobrada.` });
    } catch (err) {
      const detail = err?.data?.detail || err?.message
        || 'No se pudo reintentar el cobro (pasarela no cableada).';
      setFeedback({ variant: 'danger', text: String(detail) });
    } finally {
      setBusy(false);
    }
  }

  const runColumns = [
    { key: 'period', header: 'Período', sortable: true },
    { key: 'triggered_by', header: 'Origen', render: (r) => TRIGGER[r.triggered_by] || r.triggered_by },
    { key: 'invoices_issued', header: 'Facturas', align: 'right' },
    { key: 'amount_charged', header: 'Cobrado', align: 'right', render: (r) => money(r.amount_charged, r.currency) },
    {
      key: 'failures', header: 'Fallos', align: 'right',
      render: (r) => (r.failures > 0
        ? <Badge themeColor="error" rounded="medium">{r.failures}</Badge>
        : r.failures),
    },
    { key: 'started_at', header: 'Inicio', render: (r) => shortDate(r.started_at) },
    { key: 'finished_at', header: 'Fin', render: (r) => shortDate(r.finished_at) },
  ];

  const invoiceColumns = [
    { key: 'period', header: 'Período', sortable: true },
    { key: 'module_code', header: 'Módulo', sortable: true },
    { key: 'amount', header: 'Monto', align: 'right', render: (i) => money(i.amount, i.currency) },
    {
      key: 'status', header: 'Estado', sortable: true,
      render: (i) => {
        const s = INVOICE_STATUS[i.status] || { label: i.status, theme: 'secondary' };
        return <Badge themeColor={s.theme} rounded="medium">{s.label}</Badge>;
      },
    },
    { key: 'paid_at', header: 'Cobrada', render: (i) => shortDate(i.paid_at) },
    {
      key: 'actions', header: '', align: 'right',
      render: (i) => (i.status === 'failed' ? (
        <Button size="sm" variant="secondary" disabled={busy} onClick={() => onRetry(i)}>
          Reintentar
        </Button>
      ) : null),
    },
  ];

  return (
    <div className={styles.page}>
      <MetaTag tone="bronze">Kaupamex · Operador L0</MetaTag>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Facturación L0</h1>
          <p className={styles.lead}>
            Cobro de módulos <em>company → Kaupamex</em>. Ejecutar una corrida
            requiere <code>platform.billing</code>.
          </p>
        </div>
        <Button variant="primary" disabled={busy} onClick={onRunBilling}>
          {busy ? 'Ejecutando…' : 'Ejecutar corrida'}
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.variant} dismissible onClosed={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      <DataTable
        caption="Historial de corridas de facturación L0"
        columns={runColumns}
        rows={runs.data || []}
        rowKey={(r) => r.run_id}
        loading={runs.isLoading}
        emptyText="Aún no se ha ejecutado ninguna corrida de facturación."
      />

      <section className={styles.invoicesSection}>
        <div className={styles.filters}>
          <Select
            label="Empresa" name="company" value={companyId}
            onChange={(e) => { setCompanyId(e.target.value); setFeedback(null); }}
            options={companyOptions}
          />
        </div>
        {companyId && (
          <DataTable
            caption="Facturas de suscripción de la empresa"
            columns={invoiceColumns}
            rows={invoices.data || []}
            rowKey={(i) => i.id}
            loading={invoices.isLoading}
            emptyText="Esta empresa no tiene facturas de suscripción."
          />
        )}
      </section>
    </div>
  );
}
