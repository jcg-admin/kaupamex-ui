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
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Button, Field } from '@components/common/primitives';
import styles from './SecurityPage.module.scss';

const MOCK_SESSIONS = [
  { id: 1, device: 'Chrome · macOS',    location: 'Ciudad de México · MX', when: 'Activa ahora', current: true },
  { id: 2, device: 'Safari · iOS',      location: 'Guadalajara · MX',      when: 'hace 3 días' },
  { id: 3, device: 'Firefox · Windows', location: 'Ciudad de México · MX', when: 'hace 12 días' },
];

export default function SecurityPage() {
  const dispatch = useDispatch();
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [err, setErr] = useState('');

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
                <Field label="Contraseña actual" type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} required />
                <Field label="Contraseña nueva"  type="password" value={pwd.next}    onChange={(e) => setPwd({ ...pwd, next: e.target.value })}    required hint="Mínimo 8 caracteres" />
                <Field label="Confirmar contraseña nueva" type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} required error={err} />
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
            <Card title="Sesiones activas" subtitle="Lugares donde tu cuenta está iniciada hoy">
              <div className={styles.sessions}>
                {MOCK_SESSIONS.map((s) => (
                  <SessionRow key={s.id} session={s} />
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

function SessionRow({ session }) {
  return (
    <div className={styles.sessionRow}>
      <div className={styles.sessionDevice}>{session.device}</div>
      <div className={styles.sessionLoc}>{session.location}</div>
      <div className={`${styles.sessionWhen} ${session.current ? styles.sessionCurrent : ''}`}>
        {session.current ? '● ACTIVA · ESTE DISPOSITIVO' : session.when.toUpperCase()}
      </div>
      {!session.current ? (
        <button type="button" className={styles.sessionClose}>Cerrar</button>
      ) : (
        <span className={styles.sessionDash}>—</span>
      )}
    </div>
  );
}
