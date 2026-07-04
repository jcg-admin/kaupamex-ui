/**
 * SupportTicketCreatePage — PracticaYoruba
 * UC-SUPP-01: Crear ticket de soporte (Comprador)
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useSearchParams } from 'react-router-dom';
import {
  createSupportTicket,
  clearSupportTicketActionState,
} from '@redux/slices/supportTicketsSlice';
import { fetchOrders } from '@redux/slices/ordersSlice';
import styles from './SupportTicketCreatePage.module.scss';

// H-18: los valores deben coincidir con SupportTicket.Category del backend
// (GENERAL, ORDER, DAMAGED, URGENT, FRAUD). Antes se enviaba 'PRODUCT', que no
// es una categoría válida y el API rechazaba con 400.
const CATEGORIES = [
  { value: 'GENERAL', label: 'Consulta general' },
  { value: 'ORDER',   label: 'Problema con un pedido' },
  { value: 'DAMAGED', label: 'Producto defectuoso o dañado' },
  { value: 'URGENT',  label: 'Urgente' },
  { value: 'FRAUD',   label: 'Fraude' },
];

const INITIAL_FIELDS = {
  subject:      '',
  body:         '',
  category:     'GENERAL',
  order_number: '',
};

function validate({ subject, body }) {
  const errors = {};
  if (subject.trim().length < 5) {
    errors.subject = 'El asunto debe tener al menos 5 caracteres.';
  }
  if (body.trim().length < 10) {
    errors.body = 'La descripción debe tener al menos 10 caracteres.';
  }
  return errors;
}

export default function SupportTicketCreatePage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { isActioning, actionError, lastAction, lastCreatedId } =
    useSelector((s) => s.supportTickets);
  // H-18: se ofrece un selector con los pedidos del comprador (opcional). El
  // API resuelve order_number -> order_id; la lista de pedidos solo expone
  // order_number. Se pre-selecciona ?order= cuando se llega desde un pedido.
  const orders = useSelector((s) => s.orders?.list ?? []);
  const [fields, setFields] = useState(() => ({
    ...INITIAL_FIELDS,
    order_number: searchParams.get('order') ?? '',
  }));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    dispatch(fetchOrders({ filter: 'all' }));
  }, [dispatch]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validate(fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    const payload = {
      subject:      fields.subject.trim(),
      body:         fields.body.trim(),
      category:     fields.category,
      order_number: fields.order_number || null,
    };
    dispatch(createSupportTicket(payload));
  };

  const handleNewTicket = () => {
    setFields(INITIAL_FIELDS);
    setErrors({});
    dispatch(clearSupportTicketActionState());
  };

  if (lastAction === 'created' && lastCreatedId) {
    return (
      <section className={styles.page} aria-labelledby="ticket-success-title">
        <h1 id="ticket-success-title" className={styles.title}>
          Ticket creado correctamente
        </h1>
        <p className={styles.successMessage}>
          Tu ticket fue registrado con el número de referencia{' '}
          <strong>Ticket #{lastCreatedId}</strong>. El equipo de soporte se
          pondrá en contacto contigo a la brevedad.
        </p>
        <div className={styles.successActions}>
          <Link to={`/support/tickets/${lastCreatedId}`} className={styles.primaryBtn}>
            Ver mi ticket
          </Link>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleNewTicket}
          >
            Abrir otro ticket
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="ticket-new-title">
      <header className={styles.header}>
        <h1 id="ticket-new-title" className={styles.title}>
          Abrir ticket de soporte
        </h1>
        <p className={styles.description}>
          Cuéntanos qué ocurrió y nuestro equipo te ayudará a la brevedad.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="ticket-subject">Asunto</label>
          <input
            id="ticket-subject"
            name="subject"
            type="text"
            autoComplete="off"
            value={fields.subject}
            onChange={handleChange}
            aria-invalid={Boolean(errors.subject)}
            data-testid="ticket-subject"
          />
          {errors.subject && <span className={styles.error}>{errors.subject}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="ticket-category">Categoría</label>
          <select
            id="ticket-category"
            name="category"
            value={fields.category}
            onChange={handleChange}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="ticket-body">Descripción</label>
          <textarea
            id="ticket-body"
            name="body"
            rows={6}
            value={fields.body}
            onChange={handleChange}
            aria-invalid={Boolean(errors.body)}
          />
          {errors.body && <span className={styles.error}>{errors.body}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="ticket-order-number">Pedido relacionado (opcional)</label>
          <select
            id="ticket-order-number"
            name="order_number"
            value={fields.order_number}
            onChange={handleChange}
            data-testid="ticket-order-number"
          >
            <option value="">— Sin pedido relacionado —</option>
            {orders.map((o) => (
              <option key={o.order_number} value={o.order_number}>
                {o.order_number}
                {o.created_at
                  ? ` · ${new Date(o.created_at).toLocaleDateString('es-MX')}`
                  : ''}
              </option>
            ))}
          </select>
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {typeof actionError === 'string'
              ? actionError
              : 'No se pudo crear el ticket. Intenta de nuevo.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
            data-testid="ticket-submit"
          >
            {isActioning ? 'Enviando…' : 'Crear ticket'}
          </button>
        </div>
      </form>
    </section>
  );
}
