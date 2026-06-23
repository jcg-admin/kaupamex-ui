import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OtpInput } from '@components/common';
import styles from './TwoFactorPage.module.scss';

const STATUS = {
  IDLE:    'idle',
  PENDING: 'pending',
  ERROR:   'error',
};

export default function TwoFactorPage() {
  const [code, setCode]   = useState('');
  const [status, setStatus] = useState(STATUS.IDLE);
  const [error, setError]   = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (code.length < 6) return;
    setStatus(STATUS.PENDING);
    setError(null);

    try {
      const res = await fetch('/api/v1/auth/verify-otp/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Codigo invalido o expirado');
      }
      setStatus(STATUS.IDLE);
    } catch (err) {
      setCode('');
      setStatus(STATUS.ERROR);
      setError(err.message);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>Verificacion en dos pasos</h1>
        <p className={styles.hint}>
          Introduce el codigo de 6 digitos enviado a tu dispositivo.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <OtpInput
            length={6}
            value={code}
            onChange={setCode}
            autoFocus
            name="otp"
            aria-label="Codigo de verificacion de seis digitos"
          />

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className={styles.btnSubmit}
            disabled={code.length < 6 || status === STATUS.PENDING}
          >
            {status === STATUS.PENDING ? 'Verificando...' : 'Verificar codigo'}
          </button>
        </form>

        <p className={styles.links}>
          <Link to="/auth/login">Volver al inicio de sesion</Link>
        </p>
      </div>
    </main>
  );
}
