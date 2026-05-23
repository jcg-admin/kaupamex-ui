/**
 * ProfilePage — Práctica Yorùbà
 * Edición de datos personales: nombre, apellido, teléfono, fecha de nacimiento, avatar.
 *
 * Endpoints:
 *   GET / PATCH /auth/profile/
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchProfile, updateProfile, uploadAvatar } from '@redux/slices/authSlice';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Button, Field } from '@components/common/primitives';
import styles from './ProfilePage.module.scss';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const [form, setForm] = useState({});
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => { dispatch(fetchProfile()); }, [dispatch]);
  useEffect(() => { if (user) setForm(user); }, [user]);

  if (!user) return null;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(updateProfile(form));
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const handleAvatar = (e) => {
    const file = e.target.files?.[0];
    if (file) dispatch(uploadAvatar(file));
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/account">Mi cuenta</Link>
          <span>/</span>
          <span className={styles.bcCurrent}>Datos personales</span>
        </nav>

        <div className={styles.layout}>
          <AccountSidebar />

          <section>
            <header className={styles.header}>
              <MetaTag tone="bronze">Datos personales</MetaTag>
              <h1 className={styles.title}>Tu perfil</h1>
              <p className={styles.lead}>
                Información que usamos para envíos, comunicación y facturación.
                No se comparte con terceros.
              </p>
            </header>

            <div className={styles.avatarRow}>
              <div className={styles.avatar}>
                {user.avatar_url ? <img src={user.avatar_url} alt="" /> : initials}
              </div>
              <div>
                <div className={styles.avatarTitle}>Foto de perfil</div>
                <div className={styles.avatarDesc}>JPG o PNG, máximo 5 MB. La redimensionamos a 800×800.</div>
                <label className={styles.avatarBtn}>
                  Subir nueva foto
                  <input type="file" accept="image/jpeg,image/png" onChange={handleAvatar} hidden />
                </label>
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <Field label="Nombre"        value={form.first_name} onChange={set('first_name')} required />
                <Field label="Apellido"       value={form.last_name}  onChange={set('last_name')} />
                <Field label="Nombre de usuario" value={form.username} onChange={set('username')} required />
                <Field label="Correo electrónico" type="email" value={form.email} onChange={set('email')} required hint="Cambiar el correo requiere re-verificación" />
                <Field label="Teléfono"       value={form.phone}     onChange={set('phone')} />
                <Field label="Fecha de nacimiento" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
              </div>
              <div className={styles.formActions}>
                <Button type="submit" variant="primary">Guardar cambios</Button>
                {savedToast && <span className={styles.toast}>✓ Cambios guardados</span>}
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
