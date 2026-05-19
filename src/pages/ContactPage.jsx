/**
 * ContactPage — PracticaYoruba
 * UC-COM-01: formulario publico de contacto.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendContactMessage,
  clearContactActionState,
} from '@redux/slices/contactSlice';
import styles from './ContactPage.module.scss';

const INITIAL = { name: '', email: '', subject: '', message: '' };

function validate(form) {
  const errors = {};
  if (!form.name.trim())    errors.name    = 'El nombre es obligatorio.';
  if (!form.email.trim())   errors.email   = 'El email es obligatorio.';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
    errors.email = 'El email no tiene un formato valido.';
  if (!form.subject.trim()) errors.subject = 'El asunto es obligatorio.';
  if (!form.message.trim()) errors.message = 'El mensaje es obligatorio.';
  return errors;
}

export default function ContactPage() {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.contact);
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  const setField = (name) => (event) => {
    setForm((prev) => ({ ...prev, [name]: event.target.value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    dispatch(clearContactActionState());
    dispatch(sendContactMessage({
      name:    form.name.trim(),
      email:   form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    }));
  };

  const handleReset = () => {
    setForm(INITIAL);
    setErrors({});
    dispatch(clearContactActionState());
  };

  if (lastAction === 'sent') {
    return (
      <section className={styles.page} aria-labelledby="contact-success-title">
        <h1 id="contact-success-title" className={styles.title}>
          Mensaje recibido
        </h1>
        <p className={styles.successMessage}>
          Gracias por escribirnos. Te responderemos en un plazo aproximado de
          24 a 48 horas habiles.
        </p>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={handleReset}
        >
          Enviar otro mensaje
        </button>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="contact-title">
      <header className={styles.header}>
        <h1 id="contact-title" className={styles.title}>Contacto</h1>
        <p className={styles.description}>
          Escribenos y nuestro equipo te respondera lo antes posible.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="contact-name">Nombre</label>
          <input
            id="contact-name"
            type="text"
            value={form.name}
            onChange={setField('name')}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className={styles.fieldError}>{errors.name}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            type="email"
            value={form.email}
            onChange={setField('email')}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-subject">Asunto</label>
          <input
            id="contact-subject"
            type="text"
            value={form.subject}
            onChange={setField('subject')}
            aria-invalid={Boolean(errors.subject)}
          />
          {errors.subject && <span className={styles.fieldError}>{errors.subject}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="contact-message">Mensaje</label>
          <textarea
            id="contact-message"
            rows={6}
            value={form.message}
            onChange={setField('message')}
            aria-invalid={Boolean(errors.message)}
          />
          {errors.message && <span className={styles.fieldError}>{errors.message}</span>}
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo enviar el mensaje. Intenta de nuevo.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Enviando…' : 'Enviar mensaje'}
          </button>
        </div>
      </form>
    </section>
  );
}
