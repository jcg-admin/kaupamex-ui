/**
 * SecurityPage — Práctica Yorùbà
 * Cambio de contraseña + lista de sesiones activas + eliminar cuenta.
 *
 * Endpoints:
 *   POST /auth/change-password/
 *   POST /auth/logout/
 *   (eliminar cuenta: endpoint a confirmar con backend)
 */

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { changePassword, logoutAllSessions } from '@redux/slices/authSlice';
import { useActiveSessions, useRevokeSession } from '@hooks/domain/useActiveSessions';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Button } from '@components/common/primitives';
import { PasswordInput } from '@components/common';
import styles from './SecurityPage.module.scss';

export default function SecurityPage() {
  const dispatch = useDispatch();
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState('');
  // H-16 / UC-AUTH-17: sesiones reales (por dispositivo/IP), no datos mock.
  const { data: sessionsData, isLoading: sessionsLoading } = useActiveSessions();
  const revoke = useRevokeSession();
  const sessions = sessionsData?.results ?? [];

  const handleChangePwd = async (e) => {
    e.preventDefault();
    setErr('');
    if (pwd.next !== pwd.confirm) {
      setErr('Las contraseñas nuevas no coinciden.');
      return;
    }
    try {
      await dispatch(changePassword({ current_password: pwd.current, new_password: pwd.next })).unwrap();
      setPwd({ current: '', next: '', confirm: '' });
    } catch (e) {
      setErr('No se pudo cambiar la contraseña. Verifica tu contraseña actual.');
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/account">Mi cuenta</Link>
          <span>/</span>
          <span className={styles.bcCurrent}>Seguridad</span>
        </nav>

        <div className={styles.layout}>
          <AccountSidebar />

          <section>
            <header className={styles.header}>
              <MetaTag tone="bronze">Seguridad de la cuenta</MetaTag>
              <h1 className={styles.title}>Contraseña y sesiones</h1>
            </header>

            {/* Change password */}
            <Card title="Cambiar contraseña">
              <p className={styles.cardLead}>Te pediremos tu contraseña actual antes de aplicar el cambio.</p>
              <form className={styles.form} onSubmit={handleChangePwd}>
                <PasswordInput label="Contraseña actual" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} autoComplete="current-password" />
                <PasswordInput label="Contraseña nueva"  value={pwd.next}   onChange={(e) => setPwd({ ...pwd, next: e.target.value })}    hint="Mínimo 8 caracteres" autoComplete="new-password" />
                <PasswordInput label="Confirmar contraseña nueva" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} error={err} autoComplete="new-password" />
                <div>
                  <Button type="submit" variant="primary">Cambiar contraseña</Button>
                </div>
              </form>
              <div className={styles.warning}>
                <span className={styles.warningIcon}>!</span>
                <div>
                  El cambio de contraseña <strong>no cerrará</strong> tus sesiones en otros
                  dispositivos. Si crees que alguien más accedió, cierra todas las sesiones abajo.
                </div>
              </div>
            </Card>

            {/* Sessions */}
            <Card title="Sesiones activas" subtitle="Dispositivos donde tu cuenta está iniciada">
              <div className={styles.sessions}>
                {sessionsLoading && <p className={styles.cardLead}>Cargando sesiones…</p>}
                {!sessionsLoading && sessions.length === 0 && (
                  <p className={styles.cardLead} data-testid="sessions-empty">
                    No hay otras sesiones activas registradas.
                  </p>
                )}
                {sessions.map((s) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    onRevoke={() => revoke.mutate(s.id)}
                    revoking={revoke.isPending}
                  />
                ))}
              </div>
              <Button variant="secondary" onClick={() => dispatch(logoutAllSessions())}>
                Cerrar todas las sesiones excepto esta
              </Button>
            </Card>

            {/* Delete account */}
            <Card title="Eliminar cuenta" tone="vino">
              <p className={styles.cardLead}>
                Si eliminas tu cuenta, no podrás recuperarla. Tu historial de pedidos se
                conserva por obligación fiscal pero quedará disociado de tu persona.
              </p>
              <button type="button" className={styles.deleteBtn}>
                Solicitar eliminación →
              </button>
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

function Card({ title, subtitle, tone = 'default', children }) {
  return (
    <div className={`${styles.card} ${tone === 'vino' ? styles.cardVino : ''}`}>
      <h3 className={styles.cardTitle}>{title}</h3>
      {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
      {children}
    </div>
  );
}

function formatWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SessionRow({ session, onRevoke, revoking }) {
  const isCurrent = session.is_current;
  return (
    <div className={styles.sessionRow}>
      <div className={styles.sessionDevice}>{session.device}</div>
      <div className={styles.sessionLoc}>{session.ip_address || 'IP desconocida'}</div>
      <div className={`${styles.sessionWhen} ${isCurrent ? styles.sessionCurrent : ''}`}>
        {isCurrent
          ? '● ACTIVA · ESTE DISPOSITIVO'
          : `ÚLTIMA ACTIVIDAD · ${formatWhen(session.last_activity).toUpperCase()}`}
      </div>
      {!isCurrent ? (
        <button
          type="button"
          className={styles.sessionClose}
          onClick={onRevoke}
          disabled={revoking}
          data-testid={`session-revoke-${session.id}`}
        >
          {revoking ? 'Cerrando…' : 'Cerrar'}
        </button>
      ) : (
        <span className={styles.sessionDash}>—</span>
      )}
    </div>
  );
}
