/**
 * CheckoutPage — Práctica Yorùbà
 * UC-ORD-01: Identificación · Dirección · Envío · Pago
 * Login requerido antes de llegar aquí (ProtectedRoute).
 *
 * Envío (supersede DEC-BC-19 / DEC-BC-25): el comprador NO selecciona método
 * de envío. El envío lo configura el administrador y se deriva por zona en el
 * backend (api@358ffaa, resolve_shipping_quote). Política actual open-closed:
 * envío GRATIS siempre; el costo por debajo de umbral queda pendiente de
 * decisión. La UI solo muestra el envío derivado (gratis), no ofrece elección.
 *
 * Endpoints:
 *   GET /auth/addresses/
 *   POST /checkout/                     (sin shipping_method_id)
 *   POST /api/v2/payments/initiate/ (gateway: MERCADOPAGO)
 *   SPEI: sin llamada a /initiate/ — pedido queda PENDING, CLABE por correo.
 */

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAddresses } from '@redux/slices/addressesSlice';
import { createOrder } from '@redux/slices/checkoutSlice';
import { MetaTag, Price, Button, Field, SumRow } from '@components/common/primitives';
import Modal from '@components/common/Modal/Modal';
import logoUrl from '@assets/practica-yoruba-logo.png';
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
  const { items = [], totals = {} } = cart;

  const [email, setEmail] = useState(auth.user?.email || '');
  // H-CICLO40-06: country debe ser código ISO alpha-2 (max 2 chars). Inicializar
  // con 'MX' evita que el campo quede vacío y falle la validación del API.
  const [address, setAddress] = useState({ country: 'MX' });
  const [submitting, setSubmitting] = useState(false);
  // H-CICLO46-04: el catch anterior solo llamaba console.error — el usuario
  // nunca veía retroalimentación si createOrder o initMercadoPago/initPayPal
  // fallaban (red, validación del API, gateway caído).  Se agrega estado de
  // error y un banner visible en el formulario.
  const [submitError, setSubmitError] = useState(null);
  // Validación MX front: errores por campo (Teléfono 10, C.P. 5).
  const [fieldErrors, setFieldErrors] = useState({});
  // Confirmación explícita de datos de envío antes de pagar. No validamos la
  // cobertura del C.P.; la exactitud de la dirección es del comprador.
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => { dispatch(fetchAddresses()); }, [dispatch]);

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

  // H-03: cuando el usuario NO tiene direcciones guardadas (comprador nuevo),
  // el formulario quedaba totalmente vacío aunque su perfil ya tuviera nombre y
  // teléfono. Se pre-rellenan destinatario y teléfono desde el perfil como
  // punto de partida; los campos de dirección siguen en blanco (no están en el
  // perfil). Solo aplica si no hay dirección guardada ni datos ya escritos.
  useEffect(() => {
    const u = auth.user;
    if (!u || savedAddresses.length > 0) return;
    if (address.recipient_name || address.phone) return;
    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    const phone = (u.phone || '').replace(/\D/g, '').slice(0, 10);
    if (!fullName && !phone) return;
    setAddress((prev) => ({
      ...prev,
      recipient_name: fullName,
      phone,
      country: prev.country || 'MX',
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.user, savedAddresses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    // Validación MX (front): Teléfono y C.P. deben tener EXACTAMENTE 10 y 5
    // dígitos. La misma regla se aplica en el backend (defensa en profundidad).
    const phoneDigits = (address.phone || '').replace(/\D/g, '');
    const zipDigits   = (address.zip_code || '').replace(/\D/g, '');
    const errs = {};
    if (phoneDigits.length !== 10) {
      errs.phone = 'El teléfono debe tener exactamente 10 dígitos.';
    }
    if (zipDigits.length !== 5) {
      errs.zip_code = 'El C.P. debe tener exactamente 5 dígitos.';
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    // El envío se deriva por zona en el backend (gratis por ahora): no hay
    // método de envío que el comprador deba seleccionar. Se pide confirmación
    // explícita de que los datos de envío son correctos antes de crear la orden.
    setShowConfirm(true);
  };

  const confirmAndPay = async () => {
    setShowConfirm(false);
    setSubmitError(null);
    setSubmitting(true);
    try {
      // Sin shipping_method_id: el backend deriva el envío por zona
      // (api@358ffaa). El comprador no elige método de envío.
      const order = await dispatch(createOrder({ email, address })).unwrap();

      // El método de pago se elige en la pantalla de pago (PaymentSelectionPage,
      // paso 04 del mockup): tarjeta on-site (Mp.js, ADR-018) u OXXO/SPEI/etc.
      // CheckoutPage solo captura contacto + dirección + envío (pantalla 1) y
      // pasa el monto autoritativo por navigation-state (H-PP-04).
      navigate(`/checkout/payment/${order.order_number}`, {
        state: { amount: String(order?.total ?? totals?.total ?? '') },
      });
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
            <Step n="01" label="Bolsa"    state="done" />
            <Step n="02" label="Contacto" state="active" />
            <Step n="03" label="Envío"    state="active" />
            <Step n="04" label="Pago"     state="pending" />
            <Step n="05" label="Revisar"  state="pending" />
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
                errors={fieldErrors}
              />
            </Section>

            <Section n="03" title="Envío">
              <ShippingInfo />
            </Section>
          </div>

          <CheckoutSummary items={items} totals={totals} submitting={submitting} />
        </div>
      </form>

      <Modal
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        size="sm"
        centered
      >
        <div className={styles.confirmBox}>
          <h2 className={styles.confirmTitle}>Revisa tus datos de envío</h2>
          <p className={styles.confirmLead}>
            Confirma que el destinatario, la dirección y el C.P. estén bien
            para que tu pedido llegue sin contratiempos.
          </p>
          <div className={styles.confirmSummary}>
            <div>{address.recipient_name}</div>
            <div>
              {address.street}
              {address.neighborhood ? `, ${address.neighborhood}` : ''}
            </div>
            <div>C.P. {address.zip_code} · {address.city}, {address.state}</div>
            <div>Tel. {address.phone}</div>
          </div>
          <div className={styles.confirmActions}>
            <Button variant="secondary" onClick={() => setShowConfirm(false)}>
              Revisar
            </Button>
            <Button variant="primary" onClick={confirmAndPay} data-testid="confirm-pay">
              Continuar
            </Button>
          </div>
        </div>
      </Modal>

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

function AddressForm({ address, setAddress, savedAddresses = [], errors = {} }) {
  const set = (k) => (e) => setAddress({ ...address, [k]: e.target.value });
  // Teléfono y C.P. son numéricos MX: se descartan no-dígitos y se corta al
  // largo máximo mientras el usuario escribe (defensa junto a la validación
  // al enviar y la del backend).
  const setDigits = (k, max) => (e) =>
    setAddress({ ...address, [k]: e.target.value.replace(/\D/g, '').slice(0, max) });

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
        <Field
          label="Teléfono"
          value={address.phone}
          onChange={setDigits('phone', 10)}
          required
          autoComplete="tel"
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="10 dígitos"
          error={errors.phone}
        />
      </div>
      <Field label="Calle y número" value={address.street} onChange={set('street')} required autoComplete="address-line1" />
      <div className={styles.formRow3}>
        <Field label="Colonia" value={address.neighborhood} onChange={set('neighborhood')} required autoComplete="address-line2" />
        <Field
          label="C.P."
          value={address.zip_code}
          onChange={setDigits('zip_code', 5)}
          required
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={5}
          placeholder="5 dígitos"
          error={errors.zip_code}
        />
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
        autoResize
        maxLength={500}
        placeholder="Edificio color terracota, portero llamarse Don Aldo"
      />
    </div>
  );
}

// Envío derivado (supersede DEC-BC-19/DEC-BC-25): el comprador no selecciona
// nada. El administrador configura el envío; el backend lo deriva por zona.
// Política actual: GRATIS siempre (open-closed; costo bajo umbral pendiente).
function ShippingInfo() {
  return (
    <div className={styles.shippingInfo} data-testid="shipping-info">
      <span className={`${styles.radio} ${styles.radioActive}`} />
      <div>
        <div className={styles.optionTitle}>Envío a domicilio</div>
        <div className={styles.optionSub}>
          El costo de envío lo calculamos automáticamente según tu zona.
        </div>
      </div>
      <div className={styles.optionPrice}>
        <span className={styles.optionPriceLime}>GRATIS</span>
      </div>
    </div>
  );
}

function CheckoutSummary({ items, totals, submitting }) {
  // Envío GRATIS siempre (política open-closed; el costo por debajo de umbral
  // queda pendiente de decisión — supersede DEC-BC-19/25). El total mostrado es
  // el del carrito (IVA ya incluido en totals.total); el offset de envío es 0.
  const shippingCost = 0;
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
          <SumRow label="Envío" value="Gratis" tone="lime" />
          <div className={styles.freeShipNote} data-testid="free-ship">
            Envío GRATIS a todo México
          </div>
          <SumRow label="IVA incluido" value={`$${(totals.tax_included || 0).toLocaleString('es-MX')} MXN`} muted />
          <div className={styles.summaryTotalRow}>
            <span>Total</span>
            <Price amount={displayTotal} size="lg" />
          </div>
          <Button type="submit" variant="primary" block size="lg" disabled={submitting} data-testid="checkout-submit">
            {submitting ? 'Procesando…' : 'Continuar al pago'}
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
