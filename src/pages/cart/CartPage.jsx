/**
 * CartPage — Práctica Yorùbà
 * UC-CART-01..04: bolsa con items, voucher, totales y resumen sticky.
 *
 * Endpoints:
 *   GET /cart/
 *   PATCH /cart/items/{pk}/
 *   DELETE /cart/items/{pk}/
 *   POST /cart/voucher/  · DELETE /cart/voucher/
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  fetchCart, updateCartItem, removeCartItem,
  applyVoucher, removeVoucher,
} from '@redux/slices/cartSlice';
import {
  MetaTag, Price, Button, SumRow, EmptyState,
} from '@components/common/primitives';
import styles from './CartPage.module.scss';

const FREE_SHIPPING_THRESHOLD = 1500;

export default function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s) => s.cart || {});
  const { items = [], totals = {}, voucher = null, isLoading } = cart;

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  if (isLoading) {
    return <div className={styles.loading}>Cargando bolsa…</div>;
  }

  if (items.length === 0) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <EmptyState
            icon="◯"
            title="Aún no has elegido ninguna pieza"
            description="Explora el catálogo por òrìsà, por tipo de objeto o por uso ritual. Cuando agregues algo, lo verás aquí."
          >
            <Link to="/catalog">
              <Button variant="primary">Ir al catálogo</Button>
            </Link>
            <Link to="/catalog?cat=por-orisha">
              <Button variant="secondary">Ver por òrìsà</Button>
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  const subtotal = totals.subtotal || 0;
  const discount = totals.discount || 0;
  const total    = totals.total || subtotal;
  const ivaIncl  = totals.tax_included || 0;
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <MetaTag tone="bronze">
            Tu bolsa · {itemCount} {itemCount === 1 ? 'pieza' : 'piezas'}
          </MetaTag>
          <h1 className={styles.title}>Revisión de bolsa</h1>
        </header>

        <FreeShippingBar subtotal={subtotal} threshold={FREE_SHIPPING_THRESHOLD} />

        <div className={styles.layout}>
          <div className={styles.itemsCol}>
            <ItemList items={items} dispatch={dispatch} />
            <VoucherBox voucher={voucher} dispatch={dispatch} />
          </div>

          <CartSummary
            itemCount={itemCount}
            subtotal={subtotal}
            discount={discount}
            voucherCode={voucher?.code}
            ivaIncl={ivaIncl}
            total={total}
            onCheckout={() => navigate('/checkout')}
          />
        </div>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────────────
function FreeShippingBar({ subtotal, threshold }) {
  const pct = Math.min(100, (subtotal / threshold) * 100);
  const remaining = Math.max(0, threshold - subtotal);

  return (
    <div className={`${styles.fsBar} ${pct >= 100 ? styles.fsBarComplete : ''}`}>
      <div className={styles.fsBarHeader}>
        <span>
          {pct >= 100 ? (
            <><span className={styles.fsBarCheck}>✓</span> <strong>Tu pedido califica para envío gratis</strong></>
          ) : (
            <>
              Te faltan <strong>${remaining.toLocaleString('es-MX')}</strong> para envío gratis
            </>
          )}
        </span>
        <span className={styles.fsBarPct}>{Math.round(pct)}%</span>
      </div>
      <div className={styles.fsBarTrack}>
        <div className={styles.fsBarFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function ItemList({ items, dispatch }) {
  return (
    <div className={styles.itemList}>
      <div className={styles.itemListHeader}>
        <span>Pieza</span><span /><span>Cantidad</span><span>Subtotal</span><span />
      </div>
      {items.map((it) => (
        <CartItem key={it.id} item={it} dispatch={dispatch} />
      ))}
    </div>
  );
}

function CartItem({ item, dispatch }) {
  const handleQty = (delta) => {
    const next = Math.max(1, item.quantity + delta);
    dispatch(updateCartItem({ id: item.id, quantity: next }));
  };
  const handleRemove = () => dispatch(removeCartItem(item.id));

  return (
    <div className={styles.itemRow}>
      <div className={styles.itemImg}>
        {item.image_url
          ? <img src={item.image_url} alt={item.product_name} />
          : <div className={styles.itemImgPlaceholder} />}
      </div>
      <div className={styles.itemInfo}>
        {item.orisha_name && <MetaTag tone="coral">{item.orisha_name}</MetaTag>}
        <div className={styles.itemName}>{item.product_name}</div>
        <div className={styles.itemSku}>
          SKU · {item.sku}
          {item.variant_label && <> · {item.variant_label}</>}
        </div>
        <div className={styles.itemActions}>
          <button type="button" className={styles.itemLink}>Mover a deseos</button>
        </div>
      </div>
      <div className={styles.qtyBox}>
        <button type="button" onClick={() => handleQty(-1)} aria-label="Reducir">−</button>
        <span>{item.quantity}</span>
        <button type="button" onClick={() => handleQty(+1)} aria-label="Aumentar">+</button>
      </div>
      <div className={styles.itemPrice}>
        <Price amount={item.unit_price * item.quantity} size="sm" />
        {item.has_discount && (
          <div className={styles.itemDiscount}>oferta aplicada</div>
        )}
      </div>
      <button
        type="button"
        className={styles.itemRemove}
        onClick={handleRemove}
        aria-label="Eliminar"
      >×</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
function VoucherBox({ voucher, dispatch }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await dispatch(applyVoucher(code.trim().toUpperCase())).unwrap();
      setCode('');
    } catch (err) {
      setError(translateVoucherError(err?.code || 'INVALID'));
    }
  };

  if (voucher) {
    return (
      <div className={styles.voucherActive}>
        <div>
          <MetaTag tone="lime">Voucher activo</MetaTag>
          <div className={styles.voucherCode}>{voucher.code}</div>
          <div className={styles.voucherDesc}>{voucher.description}</div>
        </div>
        <Button variant="ghost" onClick={() => dispatch(removeVoucher())}>
          Quitar
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.voucherBox} onSubmit={handleApply}>
      <div>
        <MetaTag tone="bronze">¿Tienes un código de descuento?</MetaTag>
        <div className={styles.voucherHint}>Aplica vouchers promocionales o de referencia.</div>
      </div>
      <div className={styles.voucherForm}>
        <input
          type="text"
          placeholder="CÓDIGO"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={styles.voucherInput}
        />
        <Button type="submit" variant="secondary" disabled={!code.trim()}>
          Aplicar
        </Button>
      </div>
      {error && <div className={styles.voucherError}>{error}</div>}
    </form>
  );
}

function translateVoucherError(code) {
  const map = {
    VOUCHER_NO_EXISTE:            'Este código no existe.',
    VOUCHER_EXPIRADO:             'El código ya expiró.',
    VOUCHER_AGOTADO:              'Este código ya alcanzó su máximo de usos.',
    MONTO_MINIMO_NO_ALCANZADO:    'Tu pedido no alcanza el monto mínimo para este código.',
    VOUCHER_RESTRINGIDO_A_OTRO_EMAIL: 'Este código está vinculado a otro correo.',
    VOUCHER_NO_VALIDO_TODAVIA:    'Este código aún no está activo.',
    INVALID:                      'No pudimos aplicar el código. Inténtalo de nuevo.',
  };
  return map[code] || map.INVALID;
}

// ─────────────────────────────────────────────────────────────────────
function CartSummary({
  itemCount, subtotal, discount, voucherCode, ivaIncl, total, onCheckout,
}) {
  return (
    <aside className={styles.summary}>
      <div className={styles.summaryCard}>
        <h3 className={styles.summaryTitle}>Resumen del pedido</h3>

        <SumRow
          label={`Subtotal · ${itemCount} ${itemCount === 1 ? 'pieza' : 'piezas'}`}
          value={`$${subtotal.toLocaleString('es-MX')} MXN`}
        />
        {discount > 0 && (
          <SumRow
            label={voucherCode ? `Voucher ${voucherCode}` : 'Descuento'}
            value={`−$${discount.toLocaleString('es-MX')} MXN`}
            tone="lime"
          />
        )}
        <SumRow
          label="Envío estándar 2–4 días"
          value={subtotal >= FREE_SHIPPING_THRESHOLD ? 'Gratis' : 'Calculado en checkout'}
          tone={subtotal >= FREE_SHIPPING_THRESHOLD ? 'lime' : 'default'}
        />
        <SumRow label={`IVA incluido (16%)`} value={`$${ivaIncl.toLocaleString('es-MX')} MXN`} muted />

        <div className={styles.summaryTotal}>
          <span>Total</span>
          <Price amount={total} size="lg" />
        </div>

        <Button variant="primary" block size="lg" onClick={onCheckout}>
          Continuar al checkout →
        </Button>
        <Link to="/catalog" className={styles.summaryBack}>
          Seguir explorando
        </Link>

        <div className={styles.summaryPayments}>
          <MetaTag tone="bronze">Formas de pago aceptadas</MetaTag>
          <div className={styles.paymentsRow}>
            {['Mercado Pago', 'PayPal', 'Tarjeta', 'SPEI', 'OXXO Pay'].map(p => (
              <span key={p} className={styles.paymentBadge}>{p}</span>
            ))}
          </div>
          <div className={styles.summaryFinePrint}>
            Pago protegido por MercadoPago y PayPal. Tus datos de tarjeta nunca tocan
            nuestros servidores.
          </div>
        </div>
      </div>
    </aside>
  );
}
