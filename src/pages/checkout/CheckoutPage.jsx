/**
 * CheckoutPage — Práctica Yorùbà
 * UC-ORD-01: Identificación · Dirección · Envío · Pago
 * Login requerido antes de llegar aquí (ProtectedRoute).
 *
 * Endpoints:
 *   GET /auth/addresses/
 *   POST /checkout/
 *   POST /api/v2/payments/initiate/ (gateway: MERCADOPAGO | PAYPAL)
 *   SPEI: sin llamada a /initiate/ — pedido queda PENDING, CLABE por correo.
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAddresses } from '@redux/slices/addressesSlice';
import { createOrder, initMercadoPago, initPayPal, fetchShippingMethods } from '@redux/slices/checkoutSlice';
import { MetaTag, Price, Button, Field, SumRow } from '@components/common/primitives';
import logoUrl from '@assets/practica-yoruba-logo.svg';
import styles from './CheckoutPage.module.scss';

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s) => s.cart || {});
  const auth = useSelector((s) => s.auth || {});
  // H-CICLO33-05: fetchAddresses() se despachaba pero las direcciones guardadas
  // nunca se leían del estado Redux. El formulario siempre aparecía vacío aunque
  // el usuario tuviera direcciones guardadas. Se lee addresses.items y se pre-rellena
  // el formulario con la dirección por defecto (is_default=true) si existe.
  const savedAddresses = useSelector((s) => s.addresses?.items ?? []);
  // GAP-C1: shipping methods loaded dynamically from /api/v2/shipping-methods/
  const shippingOptions = useSelector((s) => s.checkout?.shippingOptions ?? []);
  const { items = [], totals = {} } = cart;

  const [email, setEmail] = useState(auth.user?.email || '');
  // H-CICLO40-06: country debe ser código ISO alpha-2 (max 2 chars). Inicializar
  // con 'MX' evita que el campo quede vacío y falle la validación del API.
  const [address, setAddress] = useState({ country: 'MX' });
  // GAP-C1: shipping state holds numeric DB id (or null until methods load)
  const [shipping, setShipping] = useState(null);
  const [payment, setPayment] = useState('mp');
  const [submitting, setSubmitting] = useState(false);
  // H-CICLO46-04: el catch anterior solo llamaba console.error — el usuario
  // nunca veía retroalimentación si createOrder o initMercadoPago/initPayPal
  // fallaban (red, validación del API, gateway caído).  Se agrega estado de
  // error y un banner visible en el formulario.
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => { dispatch(fetchAddresses()); }, [dispatch]);
  useEffect(() => { dispatch(fetchShippingMethods()); }, [dispatch]);

  // Auto-select first shipping method once the list loads
  useEffect(() => {
    if (shippingOptions.length > 0 && shipping === null) {
      setShipping(shippingOptions[0].id);
    }
  }, [shippingOptions, shipping]);

  // Pre-rellenar con la dirección por defecto cuando llegan las direcciones guardadas
  useEffect(() => {
    if (savedAddresses.length > 0 && !address.street) {
      const defaultAddr = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
      setAddress({
        recipient_name: defaultAddr.recipient_name || '',
        phone:          defaultAddr.phone || '',
        street:         defaultAddr.street || '',
        neighborhood:   defaultAddr.neighborhood || '',
        zip_code:       defaultAddr.zip_code || '',
        city:           defaultAddr.city || '',
        state:          defaultAddr.state || '',
        country:        defaultAddr.country || 'MX',
        notes:          defaultAddr.notes || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedAddresses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      // GAP-C1: shipping holds the numeric DB id from /api/v2/shipping-methods/.
      const shippingMethodId = Number.isFinite(Number(shipping)) ? Number(shipping) : null;
      const order = await dispatch(createOrder({
        email, address, shipping_method_id: shippingMethodId,
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
      const msg =
        err?.message ||
        err?.detail ||
        'Ocurrió un error al procesar tu pedido. Intenta de nuevo.';
      setSubmitError(msg);
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
        {submitError && (
          <p role="alert" className={styles.submitError}>
            {submitError}
          </p>
        )}
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
                autoComplete="email"
              />
            </Section>

            <Section n="02" title="Dirección de envío">
              <AddressForm
                address={address}
                setAddress={setAddress}
                savedAddresses={savedAddresses}
              />
            </Section>

            <Section n="03" title="Método de envío">
              <ShippingOptions options={shippingOptions} selected={shipping} onSelect={setShipping} />
            </Section>

            <Section n="04" title="Forma de pago">
              <PaymentMethods selected={payment} onSelect={setPayment} />
            </Section>
          </div>

          <CheckoutSummary items={items} totals={totals} shipping={shipping} shippingOptions={shippingOptions} submitting={submitting} />
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

function AddressForm({ address, setAddress, savedAddresses = [] }) {
  const set = (k) => (e) => setAddress({ ...address, [k]: e.target.value });

  const handleSelectSaved = (e) => {
    const idx = Number(e.target.value);
    if (idx === -1) { setAddress({}); return; }
    const saved = savedAddresses[idx];
    if (saved) {
      setAddress({
        recipient_name: saved.recipient_name || '',
        phone:          saved.phone || '',
        street:         saved.street || '',
        neighborhood:   saved.neighborhood || '',
        zip_code:       saved.zip_code || '',
        city:           saved.city || '',
        state:          saved.state || '',
        country:        saved.country || 'MX',
        notes:          saved.notes || '',
      });
    }
  };

  return (
    <div className={styles.addressForm}>
      {savedAddresses.length > 0 && (
        <div className={styles.savedAddressRow}>
          <label className={styles.savedAddressLabel}>
            Usar dirección guardada
            <select onChange={handleSelectSaved} className={styles.savedAddressSelect}>
              {savedAddresses.map((a, i) => (
                <option key={a.id ?? i} value={i}>
                  {a.recipient_name} — {a.street}, {a.city}
                  {a.is_default ? ' (predeterminada)' : ''}
                </option>
              ))}
              <option value={-1}>+ Ingresar nueva dirección</option>
            </select>
          </label>
        </div>
      )}
      <div className={styles.formRow2}>
        <Field label="Nombre completo del destinatario" value={address.recipient_name} onChange={set('recipient_name')} required autoComplete="name" />
        <Field label="Teléfono" value={address.phone} onChange={set('phone')} required autoComplete="tel" />
      </div>
      <Field label="Calle y número" value={address.street} onChange={set('street')} required autoComplete="address-line1" />
      <div className={styles.formRow3}>
        <Field label="Colonia" value={address.neighborhood} onChange={set('neighborhood')} required autoComplete="address-line2" />
        <Field label="C.P." value={address.zip_code} onChange={set('zip_code')} required autoComplete="postal-code" />
        <Field label="Alcaldía / Municipio" value={address.city} onChange={set('city')} required autoComplete="address-level2" />
      </div>
      <div className={styles.formRow2}>
        <Field label="Estado" value={address.state} onChange={set('state')} required autoComplete="address-level1" />
        <Field label="País" value={address.country || 'México'} onChange={set('country')} autoComplete="country" />
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

function ShippingOptions({ options = [], selected, onSelect }) {
  if (options.length === 0) {
    return <p className={styles.optionSub}>Cargando métodos de envío…</p>;
  }
  return (
    <div className={styles.options}>
      {options.map((o) => {
        const cost = Number(o.cost);
        const isFree = cost === 0;
        const priceLabel = isFree ? 'GRATIS' : `$${cost.toLocaleString('es-MX')} MXN`;
        const days = o.estimated_days === 1 ? '1 día hábil' : `${o.estimated_days} días hábiles`;
        const isSelected = selected === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onSelect(o.id)}
            className={`${styles.optionCard} ${styles.optionCardWide} ${isSelected ? styles.optionCardActive : ''}`}
          >
            <span className={`${styles.radio} ${isSelected ? styles.radioActive : ''}`} />
            <div>
              <div className={styles.optionTitle}>{o.name}</div>
              <div className={styles.optionSub}>{days}</div>
            </div>
            <div className={styles.optionPrice}>
              <span className={isFree ? styles.optionPriceLime : ''}>{priceLabel}</span>
            </div>
          </button>
        );
      })}
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

function CheckoutSummary({ items, totals, shipping, shippingOptions = [], submitting }) {
  // Derive shipping cost from the selected dynamic option (GAP-C1).
  const selectedShipping = shippingOptions.find((o) => o.id === shipping) || shippingOptions[0];
  const shippingCost = selectedShipping ? Number(selectedShipping.cost) : 0;
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
          <Button type="submit" variant="primary" block size="lg" disabled={submitting} data-testid="checkout-submit">
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
