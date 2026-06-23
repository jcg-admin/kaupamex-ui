/**
 * AdminOrdersPage — Práctica Yorùbà
 * Tabla de pedidos con filtros por estado y rango de fechas.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchAdminOrders } from '@redux/slices/adminSlice';
import { MetaTag, Button, Price } from '@components/common/primitives';
import { DataTable } from '@components/common';
import { DateRangePicker } from '@components/common/DatePicker/DateRangePicker';
import { toISODateString, fromISODateString } from '@utils/dateRange';
import styles from './AdminTablePage.module.scss';

const STATUS_FILTERS = [
  { id: 'all',               label: 'Todos' },
  { id: 'PENDING',           label: 'Pendiente pago' },
  { id: 'PROCESSING',        label: 'Procesando' },
  { id: 'IN_PREPARATION',    label: 'Preparación' },
  { id: 'SHIPPED',           label: 'En camino' },
  { id: 'DELIVERED',         label: 'Entregado' },
  { id: 'CANCELLED',         label: 'Cancelado' },
  { id: 'CANCELLED_TIMEOUT', label: 'Cancelado (timeout)' },
  { id: 'REFUNDED',          label: 'Reembolsado' },
];

const STATUS_TONE = {
  PENDING:        'muted',
  PROCESSING:     'coral',
  IN_PREPARATION: 'coral',
  SHIPPED:        'coral',
  DELIVERED:      'lime',
  CANCELLED:      'vino',
  REFUNDED:       'bronze',
};

export default function AdminOrdersPage() {
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');
  const orders = useSelector((s) => s.admin?.orders || []);
  const isLoading = useSelector((s) => s.admin?.isLoadingOrders);
  const ordersPagination = useSelector((s) => s.admin?.ordersPagination || {});
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch, from, to]);

  useEffect(() => {
    const params = { search: debouncedSearch, page };
    if (filter !== 'all') params.status = filter;
    if (from) params.from = from;
    if (to)   params.to   = to;
    dispatch(fetchAdminOrders(params));
  }, [dispatch, filter, debouncedSearch, page, from, to]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Operación · {ordersPagination.count ?? orders.length} pedidos</MetaTag>
          <h1 className={styles.title}>Pedidos</h1>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary">Exportar CSV</Button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.id}
              className={`${styles.filterBtn} ${filter === s.id ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(s.id)}
            >{s.label}</button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Buscar por número o cliente…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.search}
        />
        {/* DateRangePicker (B2): filtro por rango de fechas prometido en la
            cabecera del componente. Mantiene el canon de query params
            ?from=&to= en formato `YYYY-MM-DD` (hora local, sin desfase). */}
        <DateRangePicker
          startDate={fromISODateString(from)}
          endDate={fromISODateString(to)}
          placeholder={['Desde', 'Hasta']}
          onRangeChange={({ startDate, endDate }) => {
            setFrom(toISODateString(startDate));
            setTo(toISODateString(endDate));
          }}
        />
      </div>

      <div className={styles.tableWrap}>
        <DataTable
          columns={[
            { key: 'order_number', header: 'Pedido',
              render: (o) => (
                <Link to={`/admin/pedidos/${o.order_number}`} className={`${styles.itemName} ${styles.mono}`}>
                  {o.order_number}
                </Link>
              ) },
            { key: 'created_at',   header: 'Fecha',   sortable: true,
              render: (o) => new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) },
            { key: 'cliente',      header: 'Cliente',
              render: (o) => (
                <>
                  <div>{o.user_username ?? o.guest_email ?? '—'}</div>
                  <div className={styles.muted}>{o.user_email ?? o.guest_email ?? ''}</div>
                </>
              ) },
            { key: 'items',        header: 'Items',
              render: (o) => o.items?.length ?? 0 },
            { key: 'total',        header: 'Total',
              render: (o) => <Price amount={o.value?.total} size="sm" /> },
            { key: 'status',       header: 'Estado',
              render: (o) => (
                <span className={`${styles.statusPill} ${styles[`pill_${STATUS_TONE[o.status] || 'muted'}`]}`}>
                  {o.status_display || o.status}
                </span>
              ) },
            { key: 'actions',      header: '',
              render: (o) => (
                <Link to={`/admin/pedidos/${o.order_number}`} className={styles.actionBtn} title="Ver">→</Link>
              ) },
          ]}
          rows={orders}
          rowKey={(o) => o.order_number}
          loading={isLoading}
          emptyText="Sin pedidos que coincidan"
          caption="Pedidos de clientes"
          pageSize={0}
        />
      </div>

      {ordersPagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >← Anterior</button>
          <span className={styles.pageInfo}>
            Página {page} de {ordersPagination.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= ordersPagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >Siguiente →</button>
        </div>
      )}
    </div>
  );
}

// Cosmetic local style: muted text in table
const _ = `.muted { color: var(--c-ink-mute, #7A7D62); font-size: 11px; }`;
