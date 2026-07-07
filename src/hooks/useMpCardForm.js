/**
 * useMpCardForm — MercadoPago Checkout API CardForm hook
 *
 * Loads the MP.js v2 SDK, fetches the public key from the backend,
 * and manages the CardForm lifecycle (mount / unmount).
 *
 * The caller receives an `onSubmit` callback to wire to the DOM form's
 * submit event, and a `status` object describing readiness.
 *
 * BR-009: public_key is safe for the frontend.
 *         access_token NEVER leaves the backend.
 *
 * MP CardForm docs:
 *   https://www.mercadopago.com.mx/developers/es/docs/checkout-api/
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getMpPublicKey } from '@services/apiService';

const MP_SDK_URL = 'https://sdk.mercadopago.com/js/v2';

function loadMpScript() {
  return new Promise((resolve, reject) => {
    if (window.MercadoPago) { resolve(); return; }
    const existing = document.querySelector(`script[src="${MP_SDK_URL}"]`);
    if (existing) {
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', reject);
      return;
    }
    const s = document.createElement('script');
    s.src = MP_SDK_URL;
    s.async = true;
    s.addEventListener('load', resolve);
    s.addEventListener('error', () => reject(new Error('Failed to load MP.js')));
    document.head.appendChild(s);
  });
}

/**
 * @param {object} opts
 * @param {string} opts.amount   — total amount as string, e.g. "199.00"
 * @param {string} opts.payer_email — pre-fill payer email
 * @param {function} opts.onPayment — called with CardForm data when tokenized
 *   signature: onPayment({ token, payment_method_id, issuerId, installments,
 *                           payer: { email, identification: { type, number } } })
 */
export function useMpCardForm({ amount, payer_email = '', onPayment }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError]   = useState(null);
  // Detected card brand (from the BIN, via MP's onPaymentMethodsReceived).
  // { id, name, thumbnail, cvvLength, cvvLocation } | null. Drives the brand
  // icon next to the card number and the brand-aware security-code hint.
  const [brand, setBrand]   = useState(null);
  // Real-time form validity (from MP's onValidityChange). Starts true so the
  // button is enabled once the form is ready; flips to false (grayed) while any
  // field is invalid, per the submit-button best practice.
  const [valid, setValid]   = useState(true);
  const invalidFieldsRef     = useRef(new Set());
  const cardFormRef          = useRef(null);
  const mountedRef           = useRef(false);

  const cleanup = useCallback(() => {
    if (cardFormRef.current) {
      try { cardFormRef.current.unmount(); } catch (_) { /* ignore */ }
      cardFormRef.current = null;
    }
    mountedRef.current = false;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setStatus('loading');
      setError(null);
      try {
        const [, pkRes] = await Promise.all([
          loadMpScript(),
          getMpPublicKey(),
        ]);
        if (cancelled) return;

        const publicKey = pkRes.data?.public_key;
        if (!publicKey) throw new Error('MP public key not available');

        // MP.js cardForm is a global singleton: a second mp.cardForm() call
        // returns the existing instance ("Cardform already instantiated") with
        // stale callbacks, so onFormMounted never fires and the form dies. If a
        // form is already live in this mount, don't instantiate a second one.
        if (cardFormRef.current) return;

        const mp = new window.MercadoPago(publicKey, { locale: 'es-MX' });

        cardFormRef.current = mp.cardForm({
          amount: String(amount),
          iframe: true,
          form: {
            id:              'mp-card-form',
            cardNumber:      { id: 'mp-card-number',      placeholder: 'Número de tarjeta' },
            expirationDate:  { id: 'mp-expiration-date',  placeholder: 'MM/YY' },
            securityCode:    { id: 'mp-security-code',    placeholder: 'Código de seguridad' },
            cardholderName:  { id: 'mp-cardholder-name',  placeholder: 'Titular de la tarjeta' },
            cardholderEmail: { id: 'mp-cardholder-email', value: payer_email },
            issuer:          { id: 'mp-issuer' },
            installments:    { id: 'mp-installments' },
            identificationType:   { id: 'mp-id-type' },
            identificationNumber: { id: 'mp-id-number', placeholder: 'Número de documento' },
          },
          callbacks: {
            onFormMounted(err) {
              if (err) {
                // Surface the real MP reason (was swallowed): console + on-screen.
                console.error('[MP cardForm] onFormMounted error:', err);
                const detail = err?.message
                  || (Array.isArray(err) ? err.map(e => e?.message).filter(Boolean).join(', ') : '');
                setError(detail
                  ? `No se pudo cargar el formulario de pago: ${detail}`
                  : 'No se pudo cargar el formulario de pago.');
                setStatus('error');
                return;
              }
              if (!cancelled) { mountedRef.current = true; setStatus('ready'); }
            },
            onError(errs) {
              console.error('[MP cardForm] onError:', errs);
              if (!cancelled) {
                const msg = Array.isArray(errs) ? errs.map(e => e.message).join(', ') : String(errs);
                setError(msg);
              }
            },
            // BIN resolved: MP returns the matching payment methods. Expose the
            // brand (name + thumbnail) and its security-code rules so the UI can
            // show the card icon and a brand-aware "código de seguridad" hint.
            onPaymentMethodsReceived(err, paymentMethods) {
              if (cancelled || err) return;
              const pm = Array.isArray(paymentMethods) ? paymentMethods[0] : null;
              if (!pm) { setBrand(null); return; }
              const sc = pm.settings?.[0]?.security_code || {};
              setBrand({
                id:          pm.id,
                name:        pm.name,
                thumbnail:   pm.secure_thumbnail || pm.thumbnail || '',
                cvvLength:   sc.length || null,
                cvvLocation: sc.card_location || null, // "back" | "front"
              });
            },
            // Per-field validity → gray the submit button while any field is
            // invalid. Default is valid=true so an untouched, ready form stays
            // interactive (avoids a button that never enables).
            onValidityChange(err, field) {
              if (cancelled || !field) return;
              const set = invalidFieldsRef.current;
              if (err && (Array.isArray(err) ? err.length : true)) set.add(field);
              else set.delete(field);
              setValid(set.size === 0);
            },
            // MP calls this after CardForm.submit() succeeds tokenization
            async onSubmit(event) {
              event?.preventDefault?.();
              try {
                const data = cardFormRef.current?.getCardFormData?.();
                if (data && onPayment) {
                  onPayment({
                    token:             data.token,
                    payment_method_id: data.paymentMethodId,
                    issuerId:          data.issuerId,
                    installments:      data.installments,
                    payer: {
                      email: data.payer?.email,
                      identification: {
                        type:   data.payer?.identification?.type,
                        number: data.payer?.identification?.number,
                      },
                    },
                  });
                }
              } catch (e) {
                if (!cancelled) setError(e.message || 'Error al procesar la tarjeta.');
              }
            },
          },
        });
      } catch (e) {
        console.error('[MP cardForm] init failed (SDK load / public key):', e);
        if (!cancelled) { setError(e.message || 'Error al cargar el módulo de pago.'); setStatus('error'); }
      }
    }

    init();
    return () => { cancelled = true; cleanup(); };
  // Depend ONLY on amount. payer_email is an initial prefill; including it made
  // the effect re-run when the auth email hydrated late, re-instantiating the
  // MP singleton cardForm and killing the form. onPayment/cleanup are stable
  // (useCallback) and intentionally excluded.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  const submit = useCallback(() => {
    cardFormRef.current?.submit?.();
  }, []);

  return { status, error, submit, brand, valid };
}
