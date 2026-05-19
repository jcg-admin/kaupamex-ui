/**
 * CartPage — PracticaYoruba
 * UC-CART-01..04: visualizacion + edicion del carrito.
 *
 * Componentes internos:
 *   - CartLineItem (renderiza un item con cantidad / eliminar)
 *   - CartSummary  (subtotal + cupon + total)
 *
 * Estado se alimenta del slice `cart` (fetchCart se dispara al montar).
 * Mutaciones (updateCartItem, removeCartItem, applyVoucher) van por thunks.
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchCart,
  updateCartItem,
  removeCartItem,
  applyVoucher,
  removeVoucher,
  saveCartForLater,
  clearCartActionState,
} from '@redux/slices/cartSlice';
import styles from './CartPage.module.scss';

// ─── Linea del carrito ─────────────────────────────────────────────────
function CartLineItem({ item, onChangeQty, onRemove }) {
  const [qty, setQty] = useState(item.quantity);

  const handleBlur = () => {
    const value = Number.parseInt(qty, 10);
    if (Number.isNaN(value) || value < 1) {
      setQty(item.quantity);
      return;
    }
    if (value !== item.quantity) onChangeQty(item.id, value);
  };

  return (
    <li className={styles.lineItem} data-testid={`cart-line-${item.id}`}>
      <div className={styles.lineInfo}>
        <p className={styles.lineName}>{item.name}</p>
        {item.variant_name && (
          <p className={styles.lineVariant}>{item.variant_name}</p>
        )}
      </div>
      <label className={styles.qtyField}>
        <span className="visually-hidden">Cantidad</span>
        <input
          type="number"
          min={1}
          aria-label="Cantidad"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          onBlur={handleBlur}
        />
      </label>
      <p className={styles.linePrice}>
        ${(item.price * item.quantity).toFixed(2)}
      </p>
      <button
        type="button"
        className={styles.removeBtn}
        onClick={() => onRemove(item.id)}
      >
        Eliminar
      </button>
    </li>
  );
}

// ─── Resumen / cupon ───────────────────────────────────────────────────
function CartSummary({
  totals, voucher, onApplyVoucher, onRemoveVoucher,
  isActioning, actionError, onSaveForLater = () => {}, canSave = false,
}) {
  const [code, setCode] = useState('');

  const handleApply = (event) => {
    event.preventDefault();
    if (!code.trim()) return;
    onApplyVoucher(code.trim().toUpperCase());
  };

  return (
    <aside className={styles.summary} aria-label="Resumen del carrito">
      <h2 className={styles.summaryTitle}>Resumen</h2>

      <dl className={styles.summaryList}>
        <div className={styles.summaryRow}>
          <dt>Subtotal</dt>
          <dd>${totals.subtotal.toFixed(2)}</dd>
        </div>
        {totals.discount > 0 && (
          <div className={styles.summaryRow}>
            <dt>Descuento</dt>
            <dd>-${totals.discount.toFixed(2)}</dd>
          </div>
        )}
        <div className={styles.summaryRow}>
          <dt>IVA</dt>
          <dd>${totals.tax.toFixed(2)}</dd>
        </div>
        <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
          <dt>Total</dt>
          <dd>${totals.total.toFixed(2)}</dd>
        </div>
      </dl>

      <form onSubmit={handleApply} className={styles.voucherForm} noValidate>
        <label htmlFor="cart-voucher-code">Codigo de cupon</label>
        <div className={styles.voucherInputRow}>
          <input
            id="cart-voucher-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={Boolean(voucher) || isActioning}
          />
          {voucher ? (
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onRemoveVoucher}
            >
              Quitar
            </button>
          ) : (
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={isActioning}
            >
              Aplicar
            </button>
          )}
        </div>
        {voucher && (
          <p className={styles.voucherApplied}>
            Cupon aplicado: <strong>{voucher.code}</strong>
          </p>
        )}
        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo procesar la solicitud.'}
          </p>
        )}
      </form>

      <Link to="/checkout" className={styles.checkoutBtn}>
        Ir al pago
      </Link>

      {canSave && (
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onSaveForLater}
          disabled={isActioning}
        >
          Guardar para mas tarde
        </button>
      )}
    </aside>
  );
}

// ─── Pagina principal ──────────────────────────────────────────────────
export default function CartPage() {
  const dispatch = useDispatch();
  const {
    items, voucher, totals, isLoading,
    isActioning, actionError, lastAction,
  } = useSelector((s) => s.cart);
  const isAuthenticated = useSelector(
    (s) => s.auth?.isAuthenticated ?? false,
  );

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  useEffect(() => {
    if (lastAction === 'saved' || lastAction === 'voucher_applied') {
      const t = setTimeout(() => dispatch(clearCartActionState()), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [lastAction, dispatch]);

  const handleChangeQty   = (itemId, quantity) =>
    dispatch(updateCartItem({ itemId, quantity }));
  const handleRemoveItem  = (itemId) => dispatch(removeCartItem(itemId));
  const handleApplyVoucher = (code) => dispatch(applyVoucher(code));
  const handleRemoveVoucher = () => dispatch(removeVoucher());
  const handleSaveForLater = () => dispatch(saveCartForLater());

  if (isLoading && items.length === 0) {
    return (
      <section className={styles.page}>
        <p>Cargando carrito…</p>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className={styles.page} aria-labelledby="cart-empty-title">
        <h1 id="cart-empty-title" className={styles.title}>Tu carrito</h1>
        <p className={styles.emptyMsg}>
          Tu carrito esta vacio. Explora el catalogo para empezar.
        </p>
        <Link to="/catalog" className={styles.primaryBtn}>
          Ver catalogo
        </Link>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="cart-title">
      <h1 id="cart-title" className={styles.title}>Tu carrito</h1>

      <div className={styles.layout}>
        <ul className={styles.lineList}>
          {items.map((item) => (
            <CartLineItem
              key={item.id}
              item={item}
              onChangeQty={handleChangeQty}
              onRemove={handleRemoveItem}
            />
          ))}
        </ul>

        <CartSummary
          totals={totals}
          voucher={voucher}
          onApplyVoucher={handleApplyVoucher}
          onRemoveVoucher={handleRemoveVoucher}
          isActioning={isActioning}
          actionError={actionError}
          onSaveForLater={handleSaveForLater}
          canSave={isAuthenticated}
        />
      </div>

      {lastAction === 'saved' && (
        <p role="status" className={styles.successBanner}>
          Carrito guardado en tu cuenta.
        </p>
      )}
    </section>
  );
}
