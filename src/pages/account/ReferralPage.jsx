/**
 * ReferralPage — PracticaYoruba
 * Programa de referidos de la cuenta del comprador.
 *
 * Muestra el codigo de referido + enlace para compartir (copiar al
 * portapapeles), las metricas (total / completados / recompensas) y un
 * formulario para canjear el codigo de otro comprador.
 *
 * Endpoints (via referralSlice):
 *   GET  /api/v1/account/referral/         -> fetchReferral
 *   POST /api/v1/account/referral/redeem/  -> redeemReferral
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchReferral,
  redeemReferral,
  clearReferralRedeemState,
} from '@redux/slices/referralSlice';
import { MetaTag, Button } from '@components/common/primitives';
import styles from './ReferralPage.module.scss';

// Mensajes por codigo_error del backend para el canje de referidos.
const REDEEM_ERROR_MESSAGES = {
  SELF_REFERRAL_NOT_ALLOWED: 'No puedes canjear tu propio código de referido.',
  VOUCHER_INACTIVE:          'Este código de referido ya no está activo.',
  NOT_FOUND:                 'No encontramos ese código de referido.',
  CONFLICT:                  'Ya canjeaste un código de referido anteriormente.',
  INVALID_PAYLOAD:           'Ingresa un código de referido válido.',
};

function redeemErrorMessage(error) {
  if (!error) return null;
  return (
    REDEEM_ERROR_MESSAGES[error.code] ||
    error.message ||
    'No se pudo canjear el código. Inténtalo de nuevo.'
  );
}

export default function ReferralPage() {
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');

  const code               = useSelector((s) => s.referral?.code);
  const shareLink          = useSelector((s) => s.referral?.shareLink);
  const totalReferrals     = useSelector((s) => s.referral?.totalReferrals ?? 0);
  const completedReferrals = useSelector((s) => s.referral?.completedReferrals ?? 0);
  const rewardsEarned      = useSelector((s) => s.referral?.rewardsEarned ?? 0);
  const isLoading          = useSelector((s) => s.referral?.isLoading);
  const isProgramDisabled  = useSelector((s) => s.referral?.isProgramDisabled);
  const error              = useSelector((s) => s.referral?.error);
  const isRedeeming        = useSelector((s) => s.referral?.isRedeeming);
  const redeemError        = useSelector((s) => s.referral?.redeemError);
  const lastRedeemSucceeded = useSelector((s) => s.referral?.lastRedeemSucceeded);

  useEffect(() => {
    dispatch(fetchReferral());
  }, [dispatch]);

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleRedeemSubmit = (event) => {
    event.preventDefault();
    const trimmed = redeemCode.trim();
    if (!trimmed) return;
    dispatch(redeemReferral(trimmed));
  };

  const handleRedeemChange = (event) => {
    setRedeemCode(event.target.value);
    if (redeemError || lastRedeemSucceeded) {
      dispatch(clearReferralRedeemState());
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/account">Mi cuenta</Link>
          <span>/</span>
          <span className={styles.bcCurrent}>Programa de referidos</span>
        </nav>

        <header className={styles.header}>
          <MetaTag tone="lime">Invita y gana</MetaTag>
          <h1 className={styles.title}>Programa de referidos</h1>
          <p className={styles.lead}>
            Comparte tu código con amigos. Cuando completen su primera compra,
            ambos reciben recompensas.
          </p>
        </header>

        {isLoading && <div className={styles.loading}>Cargando…</div>}

        {!isLoading && isProgramDisabled && (
          <div className={styles.disabled} role="status">
            El programa de referidos no está disponible en este momento.
            Vuelve más tarde.
          </div>
        )}

        {!isLoading && !isProgramDisabled && error && (
          <div className={styles.error} role="alert">
            No pudimos cargar tu programa de referidos. Inténtalo más tarde.
          </div>
        )}

        {!isLoading && !isProgramDisabled && code && (
          <>
            <section className={styles.codeCard}>
              <span className={styles.codeLabel}>Tu código de referido</span>
              <strong className={styles.code} data-testid="referral-code">{code}</strong>
              {shareLink && (
                <div className={styles.shareRow}>
                  <input
                    className={styles.shareInput}
                    type="text"
                    readOnly
                    value={shareLink}
                    aria-label="Enlace para compartir"
                  />
                  <Button variant="primary" onClick={handleCopy}>
                    {copied ? 'Copiado' : 'Copiar enlace'}
                  </Button>
                </div>
              )}
            </section>

            <section className={styles.metrics} aria-label="Métricas de referidos">
              <div className={styles.metric}>
                <span className={styles.metricValue} data-testid="total-referrals">
                  {totalReferrals}
                </span>
                <span className={styles.metricLabel}>Invitados</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue} data-testid="completed-referrals">
                  {completedReferrals}
                </span>
                <span className={styles.metricLabel}>Compras completadas</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricValue} data-testid="rewards-earned">
                  {rewardsEarned}
                </span>
                <span className={styles.metricLabel}>Recompensas</span>
              </div>
            </section>
          </>
        )}

        {!isLoading && !isProgramDisabled && (
          <section className={styles.redeemCard} aria-labelledby="redeem-title">
            <h2 id="redeem-title" className={styles.redeemTitle}>
              ¿Te invitó un amigo?
            </h2>
            <p className={styles.redeemLead}>
              Ingresa el código que te compartieron para obtener tu recompensa.
            </p>

            <form onSubmit={handleRedeemSubmit} noValidate className={styles.redeemForm}>
              <label htmlFor="redeem-code" className={styles.redeemLabel}>
                Código de referido
              </label>
              <div className={styles.redeemRow}>
                <input
                  id="redeem-code"
                  name="code"
                  type="text"
                  autoComplete="off"
                  className={styles.redeemInput}
                  value={redeemCode}
                  onChange={handleRedeemChange}
                  aria-invalid={Boolean(redeemError)}
                  data-testid="redeem-code-input"
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isRedeeming || redeemCode.trim().length === 0}
                >
                  {isRedeeming ? 'Canjeando…' : 'Canjear'}
                </Button>
              </div>

              {redeemError && (
                <p role="alert" className={styles.redeemError}>
                  {redeemErrorMessage(redeemError)}
                </p>
              )}

              {lastRedeemSucceeded && (
                <p role="status" className={styles.redeemSuccess}>
                  ¡Código canjeado correctamente! Tu recompensa ya está activa.
                </p>
              )}
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
