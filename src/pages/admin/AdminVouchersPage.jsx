/**
 * AdminVouchersPage — PracticaYoruba
 * UC-PRO-02: Listar / editar vouchers
 * UC-PRO-03: Desactivar voucher
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  deactivateVoucher,
  clearVoucherActionState,
} from '@redux/slices/vouchersSlice';
import { useVouchers, VOUCHERS_QUERY_KEY } from '@hooks/domain/useVouchers';
import { DataTable } from '@components/common';
import { MetaTag } from '@components/common/primitives';
import VoucherCreateForm from '@components/admin/VoucherCreateForm';
import VoucherEditForm from '@components/admin/VoucherEditForm';
import PromotionsTimeline from '@components/admin/PromotionsTimeline';
import styles from './AdminVouchersPage.module.scss';

const TYPE_LABEL = {
  FIXED:        'Monto fijo',
  PERCENTAGE:   'Porcentaje',
  FREE_SHIPPING: 'Envio gratis',
};

function formatValue(voucher) {
  if (voucher.voucher_type === 'PERCENTAGE')   return `${voucher.discount_pct}%`;
  if (voucher.voucher_type === 'FREE_SHIPPING') return 'Envio gratis';
  return `$${voucher.discount_value}`;
}

export default function AdminVouchersPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  // H-CICLO106-01: pasar page como param para que React Query re-fetche
  // al cambiar de pagina y para que la clave del cache incluya la pagina.
  const [page, setPage] = useState(1);
  const { data: pageData, isLoading, isError } = useVouchers({ page });
  const items = pageData?.results ?? [];
  const totalCount = pageData?.count ?? 0;
  const hasNext = Boolean(pageData?.next);
  const hasPrev = page > 1;
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.vouchers);
  const [isCreateOpen, setCreateOpen]  = useState(false);
  const [editVoucher,  setEditVoucher] = useState(null);

  useEffect(() => {
    if (lastAction === 'created' || lastAction === 'updated' || lastAction === 'deactivated') {
      setCreateOpen(false);
      setEditVoucher(null);
      queryClient.invalidateQueries({ queryKey: VOUCHERS_QUERY_KEY });
      dispatch(clearVoucherActionState());
    }
  }, [lastAction, dispatch, queryClient]);

  const handleDeactivate = (voucher) => {
    const ok = window.confirm(
      `Vas a desactivar el cupon ${voucher.code}. Esta accion no se puede deshacer. Continuar?`
    );
    if (!ok) return;
    dispatch(deactivateVoucher(voucher.id));
  };

  const columns = useMemo(() => [
    { key: 'code',         header: 'Código',        sortable: true },
    { key: 'voucher_type', header: 'Tipo',           sortable: true,
      render: (v) => TYPE_LABEL[v.voucher_type] ?? v.voucher_type },
    { key: 'discount',     header: 'Valor',
      render: (v) => formatValue(v) },
    { key: 'max_uses',     header: 'Usos máximos',
      render: (v) => v.max_uses ?? 'Sin limite' },
    { key: 'valid_until',  header: 'Vigencia',
      render: (v) => v.valid_until ? v.valid_until.slice(0, 10) : '—' },
    { key: 'is_active',    header: 'Estado',
      render: (v) => (
        <span className={v.is_active ? styles.badgeActive : styles.badgeInactive}>
          {v.is_active ? 'Activo' : 'Inactivo'}
        </span>
      ) },
    { key: 'actions',      header: 'Acciones',
      render: (v) => (
        <>
          <button
            type="button"
            className={styles.secondaryBtn}
            aria-label={`Editar ${v.code}`}
            onClick={() => setEditVoucher(v)}
            disabled={isActioning}
          >
            Editar
          </button>
          {v.is_active && (
            <button
              type="button"
              className={styles.dangerBtn}
              aria-label={`Desactivar ${v.code}`}
              onClick={() => handleDeactivate(v)}
              disabled={isActioning}
              style={{ marginLeft: '0.5rem' }}
            >
              Desactivar
            </button>
          )}
        </>
      ) },
  ], [isActioning, setEditVoucher]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className={styles.page} aria-labelledby="vouchers-title">
      <header className={styles.header}>
        <div>
          <MetaTag tone="bronze">Ventas · {totalCount} {totalCount === 1 ? 'cupón' : 'cupones'}</MetaTag>
          <h1 id="vouchers-title" className={styles.title}>
            Gestión de Cupones
          </h1>
        </div>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => setCreateOpen(true)}
        >
          Nuevo cupon
        </button>
      </header>

      {isError && (
        <p role="alert" className={styles.error}>
          No se pudieron cargar los cupones. Intenta de nuevo.
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {typeof actionError === 'string'
            ? actionError
            : (actionError?.message ?? 'Ocurrio un error.')}
        </p>
      )}

      <PromotionsTimeline
        promos={items.map((v) => ({
          id: v.id,
          label: v.code,
          valid_from: v.valid_from,
          valid_until: v.valid_until,
        }))}
        title="Vigencia de cupones"
      />

      <DataTable
        columns={columns}
        rows={items}
        rowKey={(v) => v.id}
        loading={isLoading}
        emptyText="No se encontraron cupones."
        caption="Cupones de descuento"
        pageSize={0}
      />

      {/* H-CICLO106-01: controles de paginacion para navegar entre paginas
          de cupones cuando el total supera page_size=50 del API. */}
      {(hasNext || hasPrev) && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev || isLoading}
          >
            Anterior
          </button>
          <span>Pagina {page}</span>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || isLoading}
          >
            Siguiente
          </button>
          {totalCount > 0 && (
            <span className={styles.pageInfo}>{totalCount} cupones en total</span>
          )}
        </div>
      )}

      {isCreateOpen && (
        <VoucherCreateForm onClose={() => setCreateOpen(false)} />
      )}

      {editVoucher && (
        <VoucherEditForm
          voucher={editVoucher}
          onClose={() => setEditVoucher(null)}
        />
      )}
    </section>
  );
}
