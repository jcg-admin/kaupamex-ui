/**
 * AddressesPage — Práctica Yorùbà
 * CRUD de direcciones (max 5).
 *
 * Endpoints:
 *   GET / POST   /auth/addresses/
 *   GET / PATCH / DELETE  /auth/addresses/{id}/
 */

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  fetchAddresses, createAddress, deleteAddress, setDefaultAddress,
} from '@redux/slices/authSlice';
import AccountSidebar from '@components/account/AccountSidebar';
import { MetaTag, Button, Field } from '@components/common/primitives';
import styles from './AddressesPage.module.scss';

const MAX_ADDRESSES = 5;

export default function AddressesPage() {
  const dispatch = useDispatch();
  const addresses = useSelector((s) => s.auth?.user?.addresses || []);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { dispatch(fetchAddresses()); }, [dispatch]);

  const capacity = addresses.length;
  const slots = Array.from({ length: MAX_ADDRESSES }, (_, i) => addresses[i] || null);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <nav className={styles.breadcrumb}>
          <Link to="/account">Mi cuenta</Link>
          <span>/</span>
          <span className={styles.bcCurrent}>Direcciones</span>
        </nav>

        <div className={styles.layout}>
          <AccountSidebar />

          <section>
            <header className={styles.header}>
              <div>
                <MetaTag tone="bronze">{capacity} de {MAX_ADDRESSES} direcciones · capacidad máxima</MetaTag>
                <h1 className={styles.title}>Mis direcciones</h1>
              </div>
              <Button
                variant="primary"
                onClick={() => setShowForm(true)}
                disabled={capacity >= MAX_ADDRESSES}
              >
                + Añadir dirección
              </Button>
            </header>

            <div className={styles.capacityBar}>
              {slots.map((_, i) => (
                <div
                  key={i}
                  className={`${styles.capSlot} ${i < capacity ? styles.capSlotFilled : ''}`}
                />
              ))}
            </div>

            {showForm && capacity < MAX_ADDRESSES && (
              <AddressFormCard
                onSave={async (data) => {
                  await dispatch(createAddress(data));
                  setShowForm(false);
                }}
                onCancel={() => setShowForm(false)}
              />
            )}

            <div className={styles.grid}>
              {slots.map((addr, i) =>
                addr ? (
                  <AddressCard
                    key={addr.id}
                    address={addr}
                    onSetDefault={() => dispatch(setDefaultAddress(addr.id))}
                    onDelete={() => dispatch(deleteAddress(addr.id))}
                  />
                ) : (
                  <EmptySlot key={`empty-${i}`} />
                )
              )}
            </div>

            <div className={styles.note}>
              <span className={styles.noteIcon}>i</span>
              <div>
                Por reglas de la casa, puedes tener hasta <strong>{MAX_ADDRESSES} direcciones</strong> guardadas.
                Cuando llegues al límite, elimina una vieja antes de añadir otra.
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function AddressCard({ address, onSetDefault, onDelete }) {
  return (
    <article className={`${styles.card} ${address.is_default ? styles.cardDefault : ''}`}>
      <header className={styles.cardHeader}>
        <h3 className={styles.cardAlias}>{address.alias}</h3>
        {address.is_default && <MetaTag tone="lime">Predeterminada</MetaTag>}
      </header>
      <address className={styles.cardBody}>
        <strong>{address.recipient_name}</strong><br />
        {address.street}<br />
        {address.colony}, {address.city}<br />
        {address.zip_code} {address.state}, {address.country}<br />
        {address.phone}
      </address>
      <footer className={styles.cardFooter}>
        <button type="button" className={`${styles.cardAction} ${styles.cardActionEdit}`}>EDITAR</button>
        {!address.is_default && (
          <button type="button" className={`${styles.cardAction} ${styles.cardActionDefault}`} onClick={onSetDefault}>
            HACER PREDETERMINADA
          </button>
        )}
        {!address.is_default && (
          <button type="button" className={`${styles.cardAction} ${styles.cardActionDelete}`} onClick={onDelete}>
            ELIMINAR
          </button>
        )}
      </footer>
    </article>
  );
}

function EmptySlot() {
  return (
    <article className={styles.emptySlot}>
      <span className={styles.emptyPlus}>+</span>
      <span>slot libre</span>
    </article>
  );
}

function AddressFormCard({ onSave, onCancel }) {
  const [data, setData] = useState({
    alias: '', recipient_name: '', phone: '',
    street: '', colony: '', zip_code: '',
    city: '', state: '', country: 'México',
  });
  const set = (k) => (e) => setData({ ...data, [k]: e.target.value });

  return (
    <form
      className={styles.formCard}
      onSubmit={(e) => { e.preventDefault(); onSave(data); }}
    >
      <h3 className={styles.formTitle}>Nueva dirección</h3>
      <div className={styles.formGrid}>
        <Field label="Alias (Casa, Trabajo…)"   value={data.alias} onChange={set('alias')} required />
        <Field label="Nombre del destinatario" value={data.recipient_name} onChange={set('recipient_name')} required />
        <Field label="Teléfono" value={data.phone} onChange={set('phone')} required />
        <Field label="Calle y número" value={data.street} onChange={set('street')} required />
        <Field label="Colonia" value={data.colony} onChange={set('colony')} required />
        <Field label="C.P." value={data.zip_code} onChange={set('zip_code')} required />
        <Field label="Ciudad" value={data.city} onChange={set('city')} required />
        <Field label="Estado" value={data.state} onChange={set('state')} required />
      </div>
      <div className={styles.formActions}>
        <Button type="submit" variant="primary">Guardar dirección</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
      </div>
    </form>
  );
}
