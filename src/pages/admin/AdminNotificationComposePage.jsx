/**
 * AdminNotificationComposePage — PracticaYoruba
 * UC-NOT-07: Enviar notificacion manual a usuario(s) desde el admin.
 *
 * Permite tres tipos de destinatario:
 *   EMAIL   — un correo especifico
 *   ORDER   — el comprador de una orden
 *   PRODUCT — todos los compradores de un producto (segmento)
 *
 * Para destinatarios de tipo PRODUCT el admin puede pre-calcular el
 * conteo del segmento antes de confirmar el envio (UC-NOT-07 Alt C).
 */
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sendManualNotification,
  fetchManualNotificationAudience,
  clearNotificationsActionState,
} from '@redux/slices/notificationsSlice';
import styles from './AdminNotificationComposePage.module.scss';

const RECIPIENT_TYPES = [
  { value: 'EMAIL',   label: 'Email' },
  { value: 'ORDER',   label: 'Orden' },
  { value: 'PRODUCT', label: 'Producto (segmento)' },
];

export default function AdminNotificationComposePage() {
  const dispatch = useDispatch();
  const {
    audienceCount,
    isActioning,
    actionError,
    lastAction,
    lastSentReport,
  } = useSelector((s) => s.notifications);

  const [form, setForm] = useState({
    recipientType:       'EMAIL',
    recipientIdentifier: '',
    subject:             '',
    message:             '',
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const setField = (name) => (e) =>
    setForm((prev) => ({ ...prev, [name]: e.target.value }));

  const validate = () => {
    const errors = {};
    if (!form.subject.trim()) errors.subject = 'El asunto es obligatorio.';
    if (!form.message.trim()) errors.message = 'El mensaje es obligatorio.';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (!validate()) return;
    dispatch(clearNotificationsActionState());
    dispatch(sendManualNotification({
      recipientType:       form.recipientType,
      recipientIdentifier: form.recipientIdentifier,
      productId:           form.recipientType === 'PRODUCT' ? form.recipientIdentifier : null,
      subject:             form.subject,
      message:             form.message,
    }));
  };

  const handleAudience = () => {
    dispatch(fetchManualNotificationAudience({
      recipientType: form.recipientType,
      productId:     form.recipientIdentifier,
    }));
  };

  return (
    <section className={styles.page} aria-labelledby="compose-title">
      <header className={styles.header}>
        <h1 id="compose-title" className={styles.title}>
          Notificacion manual
        </h1>
        <p className={styles.description}>
          Envia un correo a un comprador o segmento de compradores.
        </p>
      </header>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.field}>
          <label htmlFor="recipient-type" className={styles.label}>
            Tipo de destinatario
          </label>
          <select
            id="recipient-type"
            className={styles.select}
            value={form.recipientType}
            onChange={setField('recipientType')}
          >
            {RECIPIENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="recipient-id" className={styles.label}>
            Identificador del destinatario
          </label>
          <input
            id="recipient-id"
            className={styles.input}
            value={form.recipientIdentifier}
            onChange={setField('recipientIdentifier')}
            placeholder={
              form.recipientType === 'EMAIL'   ? 'cliente@example.com' :
              form.recipientType === 'ORDER'   ? '#12345' :
              'ID del producto'
            }
          />
        </div>

        {form.recipientType === 'PRODUCT' && (
          <div>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleAudience}
            >
              Calcular destinatarios
            </button>
            {audienceCount !== null && (
              <p className={styles.audienceInfo}>
                {audienceCount} destinatarios serán notificados.
              </p>
            )}
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="subject" className={styles.label}>
            Asunto
          </label>
          <input
            id="subject"
            className={styles.input}
            value={form.subject}
            onChange={setField('subject')}
          />
          {fieldErrors.subject && (
            <span className={styles.fieldError}>{fieldErrors.subject}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="message" className={styles.label}>
            Mensaje
          </label>
          <textarea
            id="message"
            className={styles.textarea}
            value={form.message}
            onChange={setField('message')}
          />
          {fieldErrors.message && (
            <span className={styles.fieldError}>{fieldErrors.message}</span>
          )}
        </div>

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Enviando…' : 'Enviar notificacion'}
          </button>
        </div>
      </form>

      {lastAction === 'manual_sent' && (
        <p className={styles.success} role="status">
          Notificacion enviada
          {lastSentReport?.recipients_count
            ? ` a ${lastSentReport.recipients_count} destinatario(s).`
            : '.'}
        </p>
      )}

      {actionError && (
        <p role="alert" className={styles.error}>
          {actionError.message || 'No se pudo enviar la notificacion.'}
        </p>
      )}
    </section>
  );
}
