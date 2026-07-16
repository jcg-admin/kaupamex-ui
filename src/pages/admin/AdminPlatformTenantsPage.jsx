/**
 * AdminPlatformTenantsPage — Consola L0 del operador Kaupamex: directorio de
 * tenants (UC-PLT-12, mockup-consola-tenants-kaupamex).
 *
 * Pantalla padre de la consola de operación: lista todas las empresas (L1)
 * con su estado, número de módulos activos y usuarios, y enlaza a
 * "Provisionar" (la página de asignación de módulos, UC-PLT-05).
 *
 * Alcance de esta rebanada: SÓLO lectura del directorio. Las acciones de
 * escritura del mockup (crear tenant, suspender/reactivar) NO tienen endpoint
 * en api todavía (CompanyViewSet es read-only) — se documentan como gap en el
 * interfaz-*.rst, no se pintan botones que no funcionan.
 *
 * Contrato: GET /api/v2/platform/companies/ (platform.view) →
 *   { id, code, name, status, active_modules[], user_count, created_at }.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlatformCompanies } from '@hooks/domain/usePlatformProvision';
import { DataTable } from '@components/common';
import { MetaTag, Field, Select } from '@components/common/primitives';
import Badge from '@components/common/Badge/Badge';
import styles from './AdminPlatformTenantsPage.module.scss';

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

export default function AdminPlatformTenantsPage() {
  const companies = usePlatformCompanies();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const list = companies.data || [];
    const needle = q.trim().toLowerCase();
    return list.filter((c) => {
      if (status && c.status !== status) return false;
      if (needle && !(`${c.code} ${c.name}`.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [companies.data, status, q]);

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
        <Link className={styles.provisionLink} to={`/admin/platform/provision?company=${c.id}`}>
          Provisionar
        </Link>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <MetaTag tone="bronze">Kaupamex · Operador L0</MetaTag>
      <h1 className={styles.title}>Tenants</h1>
      <p className={styles.lead}>
        Directorio de empresas (L1) de la plataforma. Requiere la capacidad{' '}
        <code>platform.view</code>.
      </p>

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
        caption="Directorio de tenants de la plataforma"
        columns={columns}
        rows={rows}
        rowKey={(c) => c.id}
        loading={companies.isLoading}
        emptyText={
          (companies.data || []).length === 0
            ? 'Aún no hay tenants dados de alta en la plataforma.'
            : 'Ningún tenant coincide con el filtro.'
        }
      />
    </div>
  );
}
