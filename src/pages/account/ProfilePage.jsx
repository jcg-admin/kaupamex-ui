/**
 * ProfilePage — Práctica Yorùbà
 * Edición de datos personales: nombre, apellido, teléfono, fecha de nacimiento, avatar.
 *
 * Endpoints:
 *   GET / PATCH /auth/profile/
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, updateProfile, uploadAvatar } from '@redux/slices/authSlice';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Button, Field } from '@components/common/primitives';
import { FileUpload } from '@components/common';
import Avatar from '@components/common/Avatar/Avatar';
import Breadcrumb from '@components/common/Breadcrumb/Breadcrumb';
import styles from './ProfilePage.module.scss';

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth?.user);
  const profileError = useSelector((s) => s.auth?.error);
  const [form, setForm] = useState({});
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => { dispatch(fetchProfile()); }, [dispatch]);
  useEffect(() => { if (user) setForm(user); }, [user]);

  if (!user) return null;
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  // H-04: el Teléfono MX es de EXACTAMENTE 10 dígitos. El checkout ya lo
  // restringe (setDigits) pero el perfil dejaba escribir cualquier largo y
  // caracteres no numéricos; la API los guardaba mal. Se descartan no-dígitos
  // y se corta a 10 mientras el usuario escribe (misma regla que checkout).
  const setDigits = (k, max) => (e) =>
    setForm({ ...form, [k]: e.target.value.replace(/\D/g, '').slice(0, max) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // H-CICLO40-05: UpdateProfileSerializer solo acepta first_name, last_name,
    // phone, avatar, remove_avatar. username y email no son editables en este
    // endpoint; date_of_birth no existe en el modelo. Enviar solo los campos
    // permitidos para evitar confusion de usuario (parecian guardarse pero la
    // API los descartaba silenciosamente).
    const result = await dispatch(updateProfile({
      first_name: form.first_name,
      last_name:  form.last_name,
      phone:      form.phone,
    }));
    // H-CICLO118-02: solo mostrar toast de exito si el dispatch no fue
    // rechazado. authSlice almacena el error en state.auth.error en
    // updateProfile.rejected; sin esta guarda el usuario veia "Cambios
    // guardados" incluso cuando la API retornaba 400 o 500.
    if (!result.error) {
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    }
  };

  const handleAvatar = (files) => {
    if (files[0]) dispatch(uploadAvatar(files[0]));
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb
          className={styles.breadcrumb}
          currentClassName={styles.bcCurrent}
          items={[
            { label: 'Mi cuenta', to: '/account' },
            { label: 'Datos personales' },
          ]}
        />

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
              <Avatar className={styles.avatar} src={user.avatar_url} initials={initials} />
              <div>
                <div className={styles.avatarTitle}>Foto de perfil</div>
                <div className={styles.avatarDesc}>JPG o PNG, máximo 5 MB. La redimensionamos a 800×800.</div>
                <FileUpload
                  accept="image/jpeg,image/png"
                  value={[]}
                  onChange={handleAvatar}
                  label="Subir nueva foto"
                  hint="JPG o PNG, máximo 5 MB"
                  maxSizeBytes={5 * 1024 * 1024}
                />
              </div>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGrid}>
                <Field label="Nombre"        value={form.first_name} onChange={set('first_name')} required />
                <Field label="Apellido"       value={form.last_name}  onChange={set('last_name')} />
                {/* username y email son de solo lectura — no editables via este endpoint */}
                <Field label="Nombre de usuario" value={user.username} readOnly hint="El usuario no se puede cambiar desde aquí" />
                <Field label="Correo electrónico" type="email" value={user.email} readOnly hint="Cambiar el correo requiere re-verificación" />
                <Field
                  label="Teléfono"
                  value={form.phone}
                  onChange={setDigits('phone', 10)}
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="10 dígitos"
                />
              </div>
              <div className={styles.formActions}>
                <Button type="submit" variant="primary">Guardar cambios</Button>
                {savedToast && <span className={styles.toast}>✓ Cambios guardados</span>}
                {profileError && (
                  <span className={styles.toastError} role="alert">
                    {profileError.statusCode === 400
                      ? 'Datos inválidos. Revisa los campos e intenta de nuevo.'
                      : 'Error al guardar. Intenta de nuevo más tarde.'}
                  </span>
                )}
              </div>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
