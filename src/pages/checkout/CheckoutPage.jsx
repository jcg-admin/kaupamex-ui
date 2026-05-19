/**
 * CheckoutPage — PracticaYoruba
 * UC-ORD-01: Crear orden desde el carrito (checkout).
 *
 * Recoge direccion de envio + opcionalmente shipping_method_id y notas,
 * y dispara `checkoutOrder` contra POST /api/v1/checkout/.
 * Tras exito redirige a /order/<order_number>/confirmation.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkoutOrder, clearOrdersActionState } from '@redux/slices/ordersSlice';
import styles from './CheckoutPage.module.scss';

const EMPTY_ADDRESS = {
  recipient_name: '',
  street:         '',
  city:           '',
  state:          '',
  zip_code:       '',
  country:        'MX',
  phone:          '',
};

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isActioning, actionError, lastAction, lastOrder } = useSelector((s) => s.orders);
  // Tolerar stores que no incluyen el slice de auth (tests previos UC-ORD-01).
  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated ?? false);

  const [address,       setAddress]       = useState(EMPTY_ADDRESS);
  const [shippingId,    setShippingId]    = useState('');
  const [notes,         setNotes]         = useState('');
  const [acceptTerms,   setAcceptTerms]   = useState(false);
  // UC-ORD-01: campos requeridos solo para invitados (sin JWT).
  const [guestEmail,    setGuestEmail]    = useState('');
  const [guestName,     setGuestName]     = useState('');

  useEffect(() => {
    if (lastAction === 'checkout' && lastOrder?.order_number) {
      const num = lastOrder.order_number;
      dispatch(clearOrdersActionState());
      navigate(`/order/${num}/confirmation`, { replace: true });
    }
  }, [lastAction, lastOrder, navigate, dispatch]);

  const setField = (k) => (e) => setAddress({ ...address, [k]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    const payload = {
      address,
      notes,
    };
    if (shippingId) payload.shipping_method_id = Number(shippingId);
    if (!isAuthenticated) {
      // Guest checkout — UC-ORD-01: backend requiere email y nombre
      // del comprador cuando no hay JWT.
      payload.guest_email = guestEmail;
      payload.guest_name  = guestName;
    }
    dispatch(checkoutOrder(payload));
  };

  return (
    <section className={styles.page} aria-labelledby="checkout-title">
      <header className={styles.header}>
        <h1 id="checkout-title" className={styles.title}>Finalizar compra</h1>
        <p className={styles.subtitle}>
          Confirma tu direccion de envio y los datos del pedido.
        </p>
      </header>

      {!isAuthenticated && (
        <aside className={styles.guestNotice} role="note">
          <p>
            Estas comprando como invitado. Si lo prefieres,{' '}
            <Link to="/auth/login" state={{ from: { pathname: '/checkout' } }}>
              inicia sesion
            </Link>{' '}
            para guardar tu pedido en tu cuenta.
          </p>
        </aside>
      )}

      <form onSubmit={onSubmit} className={styles.form} aria-label="Formulario de checkout">
        {!isAuthenticated && (
          <fieldset className={styles.fieldset}>
            <legend>Datos de contacto</legend>
            <label>Correo electronico
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                required
              />
            </label>
            <label>Nombre completo
              <input
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                required
              />
            </label>
          </fieldset>
        )}

        <fieldset className={styles.fieldset}>
          <legend>Direccion de envio</legend>
          <label>Destinatario
            <input value={address.recipient_name} onChange={setField('recipient_name')} required />
          </label>
          <label>Calle y numero
            <input value={address.street} onChange={setField('street')} required />
          </label>
          <label>Ciudad
            <input value={address.city} onChange={setField('city')} required />
          </label>
          <label>Estado
            <input value={address.state} onChange={setField('state')} required />
          </label>
          <label>Codigo postal
            <input value={address.zip_code} onChange={setField('zip_code')} required />
          </label>
          <label>Telefono
            <input value={address.phone} onChange={setField('phone')} />
          </label>
        </fieldset>

        <fieldset className={styles.fieldset}>
          <legend>Envio</legend>
          <label>ID metodo de envio
            <input
              type="number"
              min="1"
              value={shippingId}
              onChange={(e) => setShippingId(e.target.value)}
              required
            />
          </label>
        </fieldset>

        <label className={styles.notes}>
          Notas para el pedido (opcional)
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>

        <label className={styles.terms}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            required
          />
          Acepto los terminos y condiciones de compra.
        </label>

        <button
          type="submit"
          className={styles.primaryBtn}
          disabled={isActioning || !acceptTerms}
        >
          {isActioning ? 'Procesando…' : 'Confirmar pedido'}
        </button>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message ?? 'No se pudo crear la orden. Intenta de nuevo.'}
          </p>
        )}
      </form>
    </section>
  );
}
