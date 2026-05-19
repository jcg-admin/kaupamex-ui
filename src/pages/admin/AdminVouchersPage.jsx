/**
 * AdminVouchersPage — PracticaYoruba
 * UC-PRO-02: Listar / editar vouchers
 * UC-PRO-03: Desactivar voucher
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import {
  deactivateVoucher,
  clearVoucherActionState,
} from '@redux/slices/vouchersSlice';
import { useVouchers, VOUCHERS_QUERY_KEY } from '@hooks/domain/useVouchers';
import VoucherCreateForm from '@components/admin/VoucherCreateForm';
import styles from './AdminVouchersPage.module.scss';

const TYPE_LABEL = { PERCENT: 'Porcentaje', FIXED: 'Fijo' };

function formatValue(voucher) {
  if (voucher.type === 'PERCENT') return `${voucher.value}%`;
  return `$${voucher.value}`;
}

export default function AdminVouchersPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();
  const { data: items = [], isLoading, isError } = useVouchers();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.vouchers);
  const [isCreateOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (lastAction === 'created' || lastAction === 'deactivated') {
      setCreateOpen(false);
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

  return (
    <section className={styles.page} aria-labelledby="vouchers-title">
      <header className={styles.header}>
        <h1 id="vouchers-title" className={styles.title}>
          Gestión de Cupones
        </h1>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => setCreateOpen(true)}
        >
          Nuevo cupon
        </button>
      </header>

      {isLoading && <p>Cargando cupones…</p>}

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

      {!isLoading && items.length === 0 && (
        <p className={styles.empty}>No se encontraron cupones.</p>
      )}

      {items.length > 0 && (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Usos maximos</th>
              <th>Vigencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id}>
                <td>{v.code}</td>
                <td>{TYPE_LABEL[v.type] ?? v.type}</td>
                <td>{formatValue(v)}</td>
                <td>{v.max_uses ?? 'Sin limite'}</td>
                <td>{v.ends_at ?? '—'}</td>
                <td>
                  <span
                    className={v.is_active ? styles.badgeActive : styles.badgeInactive}
                  >
                    {v.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  {v.is_active && (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      aria-label={`Desactivar ${v.code}`}
                      onClick={() => handleDeactivate(v)}
                      disabled={isActioning}
                    >
                      Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isCreateOpen && (
        <VoucherCreateForm onClose={() => setCreateOpen(false)} />
      )}
    </section>
  );
}
