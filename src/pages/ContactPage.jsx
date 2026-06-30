/**
 * ContactPage — PracticaYoruba
 * UC-COM-01: formulario publico de contacto.
 *
 * Reusa los primitivos de UI (Field/Button/MetaTag) en vez de markup crudo
 * para alinear el diseno con el resto del sitio (DEC-STF-06).
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendContactMessage,
  clearContactActionState,
} from '@redux/slices/contactSlice';
import { MetaTag, Field, Button } from '@components/common/primitives';
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
        <div className={styles.card}>
          <MetaTag tone="lime">Mensaje enviado</MetaTag>
          <h1 id="contact-success-title" className={styles.title}>
            Mensaje recibido
          </h1>
          <p className={styles.description}>
            Gracias por escribirnos. Te responderemos en un plazo aproximado
            de 24 a 48 horas hábiles a tu correo.
          </p>
          <Button variant="secondary" onClick={handleReset}>
            Enviar otro mensaje
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.page} aria-labelledby="contact-title">
      <div className={styles.card}>
        <header className={styles.header}>
          <MetaTag tone="bronze">Atención en línea</MetaTag>
          <h1 id="contact-title" className={styles.title}>Contacto</h1>
          <p className={styles.description}>
            Cuéntanos qué necesitas y nuestro equipo te responderá lo antes
            posible.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className={styles.form}>
          <Field
            label="Nombre"
            value={form.name}
            onChange={setField('name')}
            error={errors.name}
            autoComplete="name"
            required
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={setField('email')}
            error={errors.email}
            autoComplete="email"
            required
          />
          <Field
            label="Asunto"
            value={form.subject}
            onChange={setField('subject')}
            error={errors.subject}
            required
          />
          <Field
            label="Mensaje"
            textarea
            value={form.message}
            onChange={setField('message')}
            error={errors.message}
            required
          />

          {actionError && (
            <p role="alert" className={styles.error}>
              {actionError.message || 'No se pudo enviar el mensaje. Intenta de nuevo.'}
            </p>
          )}

          <div className={styles.actions}>
            <Button type="submit" variant="primary" disabled={isActioning}>
              {isActioning ? 'Enviando…' : 'Enviar mensaje'}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
