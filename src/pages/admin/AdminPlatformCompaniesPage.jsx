/**
 * AdminPlatformCompaniesPage — Consola L0 del operador Kaupamex: directorio de
 * empresas (UC-PLT-12, mockup-consola-empresas-kaupamex).
 *
 * Pantalla padre de la consola de operación: lista las empresas (L1) con su
 * estado, número de módulos activos y usuarios; permite dar de alta una empresa
 * y suspender/reactivar, y enlaza a "Provisionar" (asignación de módulos,
 * UC-PLT-05).
 *
 * Contrato (api /api/v2/platform/companies/):
 *   GET   /                    directorio (platform.view)
 *   POST  /                    alta, status forzado trial (platform.provision)
 *   POST  /<id>/suspend/       active|trial -> suspended (platform.provision)
 *   POST  /<id>/reactivate/    suspended -> active (platform.provision)
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import apiService from '@services/apiService';
import {
  usePlatformCompanies,
  PLATFORM_COMPANIES_QUERY_KEY,
} from '@hooks/domain/usePlatformProvision';
import { DataTable } from '@components/common';
import { MetaTag, Field, Select, Button, Card } from '@components/common/primitives';
import Badge from '@components/common/Badge/Badge';
import Alert from '@components/common/Alert/Alert';
import styles from './AdminPlatformCompaniesPage.module.scss';

const COMPANIES_URL = '/api/v2/platform/companies/';

const STATUS = {
  active:    { label: 'Activo',     theme: 'success' },
  trial:     { label: 'Trial',      theme: 'info' },
  suspended: { label: 'Suspendido', theme: 'error' },
  cancelled: { label: 'Cancelado',  theme: 'secondary' },
};

const STATUS_FILTER = [
  { value: '',          label: 'Todos' },
  { value: 'active',    label: 'Activo' },
  { value: 'trial',     label: 'Trial' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'cancelled', label: 'Cancelado' },
];

const EMPTY_FORM = { code: '', name: '', billing_email: '' };

export default function AdminPlatformCompaniesPage() {
  const qc = useQueryClient();
  const companies = usePlatformCompanies();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null); // { variant, text }

  const rows = useMemo(() => {
    const list = companies.data || [];
    const needle = q.trim().toLowerCase();
    return list.filter((c) => {
      if (status && c.status !== status) return false;
      if (needle && !(`${c.code} ${c.name}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [companies.data, status, q]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: PLATFORM_COMPANIES_QUERY_KEY });

  async function onCreate(e) {
    e.preventDefault();
    setBusy(true);
    setFeedback(null);
    try {
      await apiService.post(COMPANIES_URL, {
        code: form.code.trim(),
        name: form.name.trim(),
        billing_email: form.billing_email.trim() || undefined,
      });
      await invalidate();
      setForm(EMPTY_FORM);
      setCreating(false);
      setFeedback({ variant: 'success', text: `Empresa «${form.name}» creada (trial).` });
    } catch (err) {
      const detail = err?.data?.code?.[0] || err?.data?.detail || err?.message
        || 'No se pudo crear la empresa.';
      setFeedback({ variant: 'danger', text: String(detail) });
    } finally {
      setBusy(false);
    }
  }

  async function onTransition(company, verb) {
    setBusy(true);
    setFeedback(null);
    try {
      await apiService.post(`${COMPANIES_URL}${company.id}/${verb}/`);
      await invalidate();
      setFeedback({
        variant: 'success',
        text: verb === 'suspend'
          ? `Empresa «${company.name}» suspendida.`
          : `Empresa «${company.name}» reactivada.`,
      });
    } catch (err) {
      const detail = err?.data?.detail || err?.message || 'No se pudo cambiar el estado.';
      setFeedback({ variant: 'danger', text: String(detail) });
    } finally {
      setBusy(false);
    }
  }

  const columns = [
    { key: 'code', header: 'Código', sortable: true },
    { key: 'name', header: 'Nombre', sortable: true },
    {
      key: 'status', header: 'Estado', sortable: true,
      render: (c) => {
        const s = STATUS[c.status] || { label: c.status, theme: 'secondary' };
        return <Badge themeColor={s.theme} rounded="medium">{s.label}</Badge>;
      },
    },
    {
      key: 'active_modules', header: 'Módulos', align: 'right',
      render: (c) => (c.active_modules?.length ?? 0),
    },
    { key: 'user_count', header: 'Usuarios', align: 'right' },
    {
      key: 'created_at', header: 'Alta',
      render: (c) => (c.created_at ? new Date(c.created_at).toLocaleDateString('es-MX') : '—'),
    },
    {
      key: 'actions', header: '', align: 'right',
      render: (c) => (
        <div className={styles.rowActions}>
          {c.status === 'suspended' && (
            <Button size="sm" variant="secondary" disabled={busy}
              onClick={() => onTransition(c, 'reactivate')}>
              Reactivar
            </Button>
          )}
          {(c.status === 'active' || c.status === 'trial') && (
            <Button size="sm" variant="secondary" disabled={busy}
              onClick={() => onTransition(c, 'suspend')}>
              Suspender
            </Button>
          )}
          <Link className={styles.provisionLink} to={`/admin/platform/provision?company=${c.id}`}>
            Provisionar
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <MetaTag tone="bronze">Kaupamex · Operador L0</MetaTag>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Tenants</h1>
          <p className={styles.lead}>
            Directorio de empresas (L1) de la plataforma. La escritura requiere{' '}
            <code>platform.provision</code>.
          </p>
        </div>
        <Button variant="primary" onClick={() => { setCreating((v) => !v); setFeedback(null); }}>
          + Nueva empresa
        </Button>
      </div>

      {feedback && (
        <Alert variant={feedback.variant} dismissible onClosed={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      {creating && (
        <Card title="Nueva empresa" subtitle="Estado inicial: trial (fijo)" className={styles.card}>
          <form onSubmit={onCreate} className={styles.createForm}>
            <Field label="Código (slug)" name="code" required
              value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="zapateria-dos" />
            <Field label="Nombre" name="name" required
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Zapatería DOS" />
            <Field label="Correo de facturación" name="billing_email" type="email"
              value={form.billing_email}
              onChange={(e) => setForm({ ...form, billing_email: e.target.value })}
              placeholder="facturacion@zapateriados.mx" />
            <div className={styles.formActions}>
              <Button type="submit" variant="primary"
                disabled={busy || !form.code.trim() || !form.name.trim()}>
                {busy ? 'Creando…' : 'Crear empresa'}
              </Button>
              <Button type="button" variant="secondary" disabled={busy}
                onClick={() => { setCreating(false); setForm(EMPTY_FORM); }}>
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className={styles.filters}>
        <Field
          label="Buscar" name="q" value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="código o nombre"
        />
        <Select
          label="Estado" name="status" value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={STATUS_FILTER}
        />
      </div>

      <DataTable
        caption="Directorio de empresas de la plataforma"
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        loading={companies.isLoading}
        emptyText={
          (companies.data || []).length === 0
            ? 'Aún no hay empresas dados de alta en la plataforma.'
            : 'Ninguna empresa coincide con el filtro.'
        }
      />
    </div>
  );
}
