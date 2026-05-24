/**
 * CheckoutPage — Práctica Yorùbà
 * UC-ORD-01: Identificación · Dirección · Envío · Pago
 * Login requerido antes de llegar aquí (ProtectedRoute).
 *
 * Endpoints:
 *   GET /auth/addresses/
 *   POST /checkout/
 *   POST /api/v1/payments/initiate/ (gateway: MERCADOPAGO | PAYPAL)
 *   SPEI: sin llamada a /initiate/ — pedido queda PENDING, CLABE por correo.
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAddresses } from '@redux/slices/addressesSlice';
import { createOrder, initMercadoPago, initPayPal } from '@redux/slices/checkoutSlice';
import { MetaTag, Price, Button, Field, SumRow } from '@components/common/primitives';
import logoUrl from '@assets/practica-yoruba-logo.svg';
import styles from './CheckoutPage.module.scss';

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s) => s.cart || {});
  const auth = useSelector((s) => s.auth || {});
  const { items = [], totals = {} } = cart;

  const [email, setEmail] = useState(auth.user?.email || '');
  const [address, setAddress] = useState({});
  const [shipping, setShipping] = useState('std');
  const [payment, setPayment] = useState('mp');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { dispatch(fetchAddresses()); }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const order = await dispatch(createOrder({
        email, address, shipping_method_id: shipping,
      })).unwrap();

      let checkout_url = null;
      if (payment === 'mp') {
        const result = await dispatch(initMercadoPago({ order_number: order.order_number })).unwrap();
        checkout_url = result.checkout_url;
      } else if (payment === 'pp') {
        const result = await dispatch(initPayPal({ order_number: order.order_number })).unwrap();
        checkout_url = result.checkout_url;
      }
      // SPEI: checkout_url queda null — pedido PENDING, CLABE enviada por correo.

      if (checkout_url) {
        window.location.href = checkout_url;
      } else {
        navigate(`/order/${order.order_number}/confirmation`);
      }
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      {/* Mini header */}
      <header className={styles.checkoutHeader}>
        <div className={styles.checkoutHeaderInner}>
          <Link to="/" className={styles.brand}>
            <img src={logoUrl} alt="" className={styles.brandLogo} />
            <span>
              <span className={styles.brandName}>Práctica Yorùbà</span>
              <span className={styles.brandTag}>Ifá · Òrìṣà · Olódùmarè</span>
            </span>
          </Link>
          <div className={styles.steps}>
            <Step n="01" label="Carrito"        state="done" />
            <Step n="02" label="Datos y envío"  state="active" />
            <Step n="03" label="Pago"           state="pending" />
            <Step n="04" label="Confirmación"   state="pending" />
          </div>
          <div className={styles.secureBadge}>PAGO PROTEGIDO · SSL/TLS</div>
        </div>
      </header>

      <form className={styles.container} onSubmit={handleSubmit}>
        <div className={styles.layout}>
          <div className={styles.mainCol}>
            <Section n="01" title="Identificación">
              <Field
                label="Correo de contacto"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.mx"
                type="email"
                required
                hint="Te enviaremos el comprobante y el seguimiento a este correo."
              />
            </Section>

            <Section n="02" title="Dirección de envío">
              <AddressForm address={address} setAddress={setAddress} />
            </Section>

            <Section n="03" title="Método de envío">
              <ShippingOptions selected={shipping} onSelect={setShipping} />
            </Section>

            <Section n="04" title="Forma de pago">
              <PaymentMethods selected={payment} onSelect={setPayment} />
            </Section>
          </div>

          <CheckoutSummary items={items} totals={totals} shipping={shipping} submitting={submitting} />
        </div>
      </form>

      <footer className={styles.checkoutFooter}>
        <span>© {new Date().getFullYear()} Práctica Yorùbà</span>
        <span className={styles.footerLinks}>
          <Link to="/info/terminos">Términos</Link>
          <Link to="/info/privacidad">Privacidad</Link>
          <Link to="/info/envios">Envíos &amp; devoluciones</Link>
          <Link to="/help">Ayuda</Link>
        </span>
      </footer>
    </main>
  );
}

function Step({ n, label, state }) {
  return (
    <div className={`${styles.step} ${styles[`step_${state}`]}`}>
      <span className={styles.stepNum}>{state === 'done' ? '✓' : n}</span>
      <span className={styles.stepLabel}>{label}</span>
    </div>
  );
}

function Section({ n, title, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHeader}>
        <span className={styles.sectionNum}>· {n} ·</span>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function AddressForm({ address, setAddress }) {
  const set = (k) => (e) => setAddress({ ...address, [k]: e.target.value });
  return (
    <div className={styles.addressForm}>
      <div className={styles.formRow2}>
        <Field label="Nombre completo del destinatario" value={address.recipient_name} onChange={set('recipient_name')} required />
        <Field label="Teléfono" value={address.phone} onChange={set('phone')} required />
      </div>
      <Field label="Calle y número" value={address.street} onChange={set('street')} required />
      <div className={styles.formRow3}>
        <Field label="Colonia" value={address.colony} onChange={set('colony')} required />
        <Field label="C.P." value={address.zip_code} onChange={set('zip_code')} required />
        <Field label="Alcaldía / Municipio" value={address.city} onChange={set('city')} required />
      </div>
      <div className={styles.formRow2}>
        <Field label="Estado" value={address.state} onChange={set('state')} required />
        <Field label="País" value={address.country || 'México'} onChange={set('country')} />
      </div>
      <Field
        label="Referencias para entrega (opcional)"
        value={address.notes} onChange={set('notes')}
        textarea
        placeholder="Edificio color terracota, portero llamarse Don Aldo"
      />
    </div>
  );
}

// Shipping cost data shared between ShippingOptions and CheckoutSummary.
// priceAmount: numeric MXN cost (0 = free). Used in the summary to show
// the real shipping cost rather than a hardcoded "Gratis".
export const SHIPPING_OPTIONS = [
  { id: 'std',    t: 'Estándar resguardado', sub: 'DHL · 2 a 4 días hábiles',            priceLabel: 'GRATIS',   priceNote: 'incluido en tu pedido', priceAmount: 0,   tone: 'lime' },
  { id: 'exp',    t: 'Expedito · 24 horas',  sub: 'DHL Express · solo CDMX y zona metro', priceLabel: '$280 MXN', priceNote: '',                      priceAmount: 280, tone: ''     },
  { id: 'pickup', t: 'Recoger en tienda',    sub: 'Punto de recogida · L-V 10-19',       priceLabel: 'GRATIS',   priceNote: 'cita por correo',        priceAmount: 0,   tone: 'lime' },
];

function ShippingOptions({ selected, onSelect }) {
  const opts = SHIPPING_OPTIONS;
  return (
    <div className={styles.options}>
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect(o.id)}
          className={`${styles.optionCard} ${styles.optionCardWide} ${selected === o.id ? styles.optionCardActive : ''}`}
        >
          <span className={`${styles.radio} ${selected === o.id ? styles.radioActive : ''}`} />
          <div>
            <div className={styles.optionTitle}>{o.t}</div>
            <div className={styles.optionSub}>{o.sub}</div>
          </div>
          <div className={styles.optionPrice}>
            <span className={o.tone === 'lime' ? styles.optionPriceLime : ''}>{o.priceLabel}</span>
            {o.priceNote && <span className={styles.optionPriceNote}>{o.priceNote}</span>}
          </div>
        </button>
      ))}
    </div>
  );
}

const PAYMENT_INFO = {
  gateway: 'Al confirmar, te llevamos a la página segura del proveedor para completar el cobro. Tus datos de tarjeta nunca tocan nuestros servidores. Volvarás aquí automáticamente al terminar.',
  spei:    'Al confirmar, te enviaremos una CLABE bancaria a tu correo. Tienes 24 horas para realizar la transferencia; mientras tanto tu pedido queda reservado.',
};

function PaymentMethods({ selected, onSelect }) {
  const opts = [
    { id: 'mp',   t: 'Mercado Pago',          sub: 'Tarjeta · SPEI · OXXO Pay · 6 meses sin intereses', external: true  },
    { id: 'pp',   t: 'PayPal',                 sub: 'Cuenta PayPal o tarjeta sin compartir datos',         external: true  },
    { id: 'spei', t: 'Transferencia SPEI',     sub: 'Recibirás CLABE única · pedido reservado 24 hrs',     external: false },
  ];
  const infoText = selected === 'spei' ? PAYMENT_INFO.spei : PAYMENT_INFO.gateway;
  return (
    <div className={styles.options}>
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect(o.id)}
          className={`${styles.optionCard} ${styles.optionCardWide} ${selected === o.id ? styles.optionCardActive : ''}`}
        >
          <span className={`${styles.radio} ${selected === o.id ? styles.radioActive : ''}`} />
          <div>
            <div className={styles.optionTitle}>{o.t}</div>
            <div className={styles.optionSub}>{o.sub}</div>
          </div>
          {o.external && <span className={styles.optionExternal}>Externo ↗</span>}
        </button>
      ))}
      <div className={styles.infoBox}>
        <span className={styles.infoBoxIcon}>· i ·</span>
        <div>{infoText}</div>
      </div>
    </div>
  );
}

function CheckoutSummary({ items, totals, shipping, submitting }) {
  // Derive shipping cost from the selected option so the summary reflects the
  // real cost before the user confirms (H-CICLO24-03: was hardcoded "Gratis").
  const selectedShipping = SHIPPING_OPTIONS.find((o) => o.id === shipping) || SHIPPING_OPTIONS[0];
  const shippingCost = selectedShipping.priceAmount;
  const shippingLabel = shippingCost > 0
    ? `$${shippingCost.toLocaleString('es-MX')} MXN`
    : 'Gratis';
  const shippingTone = shippingCost > 0 ? '' : 'lime';
  // Displayed total = cart subtotal_net + shipping cost (tax is already included
  // in totals.total from the cart API; we add the local shipping offset).
  const cartTotal = Number(totals.total) || 0;
  const displayTotal = cartTotal + shippingCost;

  return (
    <aside className={styles.summary}>
      <div className={styles.summaryCard}>
        <header className={styles.summaryHeader}>
          <h3 className={styles.summaryTitle}>Tu pedido</h3>
          <div className={styles.summaryMeta}>{items.length} PIEZAS</div>
        </header>
        <div className={styles.summaryItems}>
          {items.map((it) => (
            <div key={it.id} className={styles.summaryItem}>
              <div className={styles.summaryItemImg}>
                {it.image_url ? <img src={it.image_url} alt="" /> : null}
              </div>
              <div>
                <div className={styles.summaryItemName}>{it.product_name}</div>
                {it.orisha_name && <div className={styles.summaryItemOrisha}>{it.orisha_name.toUpperCase()}</div>}
              </div>
              <Price amount={it.unit_price * it.quantity} size="sm" />
            </div>
          ))}
        </div>
        <div className={styles.summaryTotals}>
          <SumRow label="Subtotal" value={`$${(totals.subtotal || 0).toLocaleString('es-MX')} MXN`} />
          {totals.discount > 0 && <SumRow label="Descuento" value={`−$${totals.discount.toLocaleString('es-MX')} MXN`} tone="lime" />}
          <SumRow label="Envío" value={shippingLabel} tone={shippingTone} />
          <SumRow label="IVA incluido" value={`$${(totals.tax_included || 0).toLocaleString('es-MX')} MXN`} muted />
          <div className={styles.summaryTotalRow}>
            <span>Total</span>
            <Price amount={displayTotal} size="lg" />
          </div>
          <Button type="submit" variant="primary" block size="lg" disabled={submitting}>
            {submitting ? 'Procesando…' : 'Confirmar y pagar'}
          </Button>
          <div className={styles.summaryDisclaimer}>
            Al confirmar aceptas los <Link to="/info/terminos">términos</Link> y el{' '}
            <Link to="/info/privacidad">aviso de privacidad</Link>.
          </div>
        </div>
      </div>
    </aside>
  );
}
