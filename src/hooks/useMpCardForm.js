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

// Ref a nivel de módulo al CardForm de MP vivo. MP.js registra los "contextos"
// de sus campos seguros (expirationFields, cardNumber, securityCode…) en un
// registro GLOBAL que cardForm.unmount() no siempre limpia entre remounts o
// revisitas SPA, así que un segundo mp.cardForm() lanza "Context 'X' already
// exists". Rastrear la instancia viva aquí permite desmontarla antes de crear
// otra (y recuperar si MP aún reporta un contexto viejo).
let activeCardForm = null;

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
export function useMpCardForm({ amount, payer_email = '', cardholder_name = '', onPayment }) {
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
  // Watchdog: if MP never fires onFormMounted (it can throw its "Context
  // already exists" asynchronously, out of our try/catch), the form would hang
  // on "loading" forever. This timer flips to an actionable error instead.
  const watchdogRef          = useRef(null);

  const cleanup = useCallback(() => {
    if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
    if (cardFormRef.current) {
      try { cardFormRef.current.unmount(); } catch (_) { /* ignore */ }
      // Do NOT null activeCardForm here. unmount() does not reliably clear MP's
      // GLOBAL secure-field context registry during teardown, so the next mount
      // must keep the reference to unmount it again at a better time (fresh DOM)
      // before creating a new CardForm — otherwise it throws "already exists".
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

        // A CardForm from a PREVIOUS mount (other route visit, StrictMode
        // remount) may still hold MP's global secure-field contexts even after
        // its own cleanup ran. Unmount it before creating a new one so MP does
        // not throw "Context 'expirationFields' already exists".
        if (activeCardForm) {
          try { activeCardForm.unmount(); } catch (_) { /* ignore */ }
          activeCardForm = null;
        }

        const mp = new window.MercadoPago(publicKey, { locale: 'es-MX' });

        const cardFormConfig = {
          amount: String(amount),
          iframe: true,
          form: {
            id:              'mp-card-form',
            cardNumber:      { id: 'mp-card-number',      placeholder: 'Número de tarjeta' },
            expirationDate:  { id: 'mp-expiration-date',  placeholder: 'MM/YY' },
            securityCode:    { id: 'mp-security-code',    placeholder: 'Código de seguridad' },
            cardholderName:  { id: 'mp-cardholder-name',  placeholder: 'Titular de la tarjeta', value: cardholder_name },
            cardholderEmail: { id: 'mp-cardholder-email', value: payer_email },
            issuer:          { id: 'mp-issuer' },
            // installments es OBLIGATORIO para que MP.js complete el montaje y
            // dispare onFormMounted; omitirlo dejaba el formulario colgado sin
            // mostrarse (H-PP-07). El <select> vive oculto en el DOM: MP lo
            // rellena y usamos la 1ª opción (1 cuota) — no ofrecemos MSI.
            installments:    { id: 'mp-installments' },
            // MX no requiere identificación del pagador para tarjeta:
            // identificationType/Number se omiten del form.
          },
          callbacks: {
            onFormMounted(err) {
              if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
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
                  const payer = { email: data.payer?.email };
                  // Identification is optional in MX and no longer collected;
                  // forward it only if MP still returns it.
                  const idType = data.payer?.identification?.type;
                  const idNumber = data.payer?.identification?.number;
                  if (idType || idNumber) {
                    payer.identification = { type: idType, number: idNumber };
                  }
                  onPayment({
                    token:             data.token,
                    payment_method_id: data.paymentMethodId,
                    issuerId:          data.issuerId,
                    installments:      data.installments || 1,
                    payer,
                  });
                }
              } catch (e) {
                if (!cancelled) setError(e.message || 'Error al procesar la tarjeta.');
              }
            },
          },
        };

        // Create the CardForm. If MP still reports a leaked context from a
        // prior mount ("Context 'X' already exists"), tear the tracked
        // instance down and retry once — then it mounts clean.
        try {
          cardFormRef.current = mp.cardForm(cardFormConfig);
        } catch (mountErr) {
          if (/already exists/i.test(mountErr?.message || '')) {
            try { activeCardForm?.unmount(); } catch (_) { /* ignore */ }
            activeCardForm = null;
            cardFormRef.current = mp.cardForm(cardFormConfig);
          } else {
            throw mountErr;
          }
        }
        activeCardForm = cardFormRef.current;

        // Watchdog: MP can throw "Context 'expirationFields' already exists"
        // ASYNCHRONOUSLY while mounting its iframes (outside this try/catch), in
        // which case onFormMounted never fires and the form hangs on "loading".
        // If it hasn't mounted in 8s, surface an actionable error (the UI offers
        // a reload — a fresh JS context has an empty MP registry and mounts clean).
        watchdogRef.current = setTimeout(() => {
          if (!cancelled && !mountedRef.current) {
            console.error('[MP cardForm] mount timed out (no onFormMounted)');
            setError('No se pudo cargar el formulario de pago. Recarga la página para reintentar.');
            setStatus('error');
          }
        }, 8000);
      } catch (e) {
        console.error('[MP cardForm] init failed (SDK load / public key):', e);
        if (watchdogRef.current) { clearTimeout(watchdogRef.current); watchdogRef.current = null; }
        if (!cancelled) {
          // A surviving "already exists" means MP's global context is stuck in
          // this JS context; a page reload (clean context) is the reliable exit.
          const msg = /already exists/i.test(e?.message || '')
            ? 'No se pudo cargar el formulario de pago. Recarga la página para reintentar.'
            : (e.message || 'Error al cargar el módulo de pago.');
          setError(msg);
          setStatus('error');
        }
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
