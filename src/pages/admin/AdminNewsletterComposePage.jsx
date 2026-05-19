/**
 * AdminNewsletterComposePage — PracticaYoruba
 * UC-NEW-04: el admin compone y envia (o programa) una campana.
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendNewsletterBroadcast,
  clearNewsletterActionState,
} from '@redux/slices/newsletterSlice';
import styles from './AdminNewsletterComposePage.module.scss';

const SEGMENTS = [
  { value: 'ALL_ACTIVE', label: 'Todos los suscriptores activos' },
  { value: 'NEW_30D',    label: 'Suscriptores nuevos (ultimos 30 dias)' },
  { value: 'OLDEST',     label: 'Suscriptores antiguos (mas de 1 ano)' },
];

const INITIAL = {
  subject:     '',
  htmlBody:    '',
  textBody:    '',
  segment:     'ALL_ACTIVE',
  scheduledAt: '',
};

function validate(form) {
  const errors = {};
  if (!form.subject.trim())   errors.subject  = 'El asunto es obligatorio.';
  if (!form.htmlBody.trim())  errors.htmlBody = 'El contenido HTML es obligatorio.';
  if (!form.textBody.trim())  errors.textBody = 'El contenido en texto plano es obligatorio.';
  return errors;
}

export default function AdminNewsletterComposePage() {
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction, lastCampaign } =
    useSelector((s) => s.newsletter);
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
    dispatch(clearNewsletterActionState());
    dispatch(sendNewsletterBroadcast({
      subject:     form.subject.trim(),
      htmlBody:    form.htmlBody,
      textBody:    form.textBody,
      segment:     form.segment,
      scheduledAt: form.scheduledAt || null,
    }));
  };

  return (
    <section className={styles.page} aria-labelledby="compose-title">
      <header className={styles.header}>
        <h1 id="compose-title" className={styles.title}>Nueva campana</h1>
        <p className={styles.description}>
          Envia un boletin al segmento de suscriptores seleccionado.
        </p>
      </header>

      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="campaign-subject">Asunto</label>
          <input
            id="campaign-subject"
            type="text"
            value={form.subject}
            onChange={setField('subject')}
            aria-invalid={Boolean(errors.subject)}
          />
          {errors.subject && <span className={styles.fieldError}>{errors.subject}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="campaign-segment">Segmento</label>
          <select
            id="campaign-segment"
            value={form.segment}
            onChange={setField('segment')}
          >
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="campaign-html">Contenido HTML</label>
          <textarea
            id="campaign-html"
            rows={6}
            value={form.htmlBody}
            onChange={setField('htmlBody')}
            aria-invalid={Boolean(errors.htmlBody)}
          />
          {errors.htmlBody && <span className={styles.fieldError}>{errors.htmlBody}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="campaign-text">Contenido en texto plano</label>
          <textarea
            id="campaign-text"
            rows={4}
            value={form.textBody}
            onChange={setField('textBody')}
            aria-invalid={Boolean(errors.textBody)}
          />
          {errors.textBody && <span className={styles.fieldError}>{errors.textBody}</span>}
        </div>

        <div className={styles.field}>
          <label htmlFor="campaign-schedule">Programar para (opcional)</label>
          <input
            id="campaign-schedule"
            type="datetime-local"
            value={form.scheduledAt}
            onChange={setField('scheduledAt')}
          />
        </div>

        {actionError && (
          <p role="alert" className={styles.error}>
            {actionError.message || 'No se pudo enviar la campana.'}
          </p>
        )}

        {lastAction === 'broadcast_sent' && (
          <p role="status" className={styles.success}>
            Campana encolada
            {lastCampaign?.recipients_count
              ? ` para ${lastCampaign.recipients_count} destinatarios.`
              : '.'}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Enviando…' : 'Enviar campana'}
          </button>
        </div>
      </form>
    </section>
  );
}
