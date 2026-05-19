/**
 * AddressesPage — PracticaYoruba
 * UC-AUTH-07: Libreta de direcciones de envio del comprador.
 *
 * Lecturas via useAddresses (React Query); mutaciones via addressesSlice
 * (canonical D-010) preservando lastAction.
 */
import { useCallback, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAddresses, ADDRESSES_KEY } from '@hooks/domain/useAddresses';
import {
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  clearAddressesActionState,
} from '@redux/slices/addressesSlice';
import styles from './AddressesPage.module.scss';

const REQUIRED_FIELDS = [
  'recipient', 'street', 'exterior_number',
  'neighborhood', 'city', 'state', 'postal_code', 'phone',
];

const LABELS = {
  recipient:       'Destinatario',
  street:          'Calle',
  exterior_number: 'Numero exterior',
  interior_number: 'Numero interior (opcional)',
  neighborhood:    'Colonia',
  city:            'Ciudad',
  state:           'Estado',
  postal_code:     'Codigo postal',
  phone:           'Telefono de contacto',
};

const EMPTY_FORM = {
  recipient: '', street: '', exterior_number: '',
  interior_number: '', neighborhood: '', city: '',
  state: '', postal_code: '', phone: '', country: 'MX',
};

function AddressForm({ initial = EMPTY_FORM, isEditing, onSubmit, onCancel, isActioning, apiError }) {
  const [fields, setFields] = useState(initial);
  const [errors, setErrors] = useState({});

  const handleChange = (ev) => {
    setFields((p) => ({ ...p, [ev.target.name]: ev.target.value }));
    if (errors[ev.target.name]) {
      setErrors((p) => ({ ...p, [ev.target.name]: '' }));
    }
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    const e = {};
    REQUIRED_FIELDS.forEach((k) => {
      if (!fields[k]?.trim()) e[k] = `${LABELS[k]} es obligatorio.`;
    });
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onSubmit(fields);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.form}>
      <h2 className={styles.formTitle}>
        {isEditing ? 'Editar direccion' : 'Nueva direccion'}
      </h2>

      {Object.keys(LABELS).map((key) => (
        <div key={key} className={styles.field}>
          <label htmlFor={`addr-${key}`}>{LABELS[key]}</label>
          <input
            id={`addr-${key}`}
            type={key === 'phone' ? 'tel' : 'text'}
            name={key}
            value={fields[key]}
            onChange={handleChange}
            aria-invalid={!!errors[key]}
          />
          {errors[key] && (
            <span className={styles.fieldError}>{errors[key]}</span>
          )}
          {apiError?.validationErrors?.[key]?.[0] && (
            <span className={styles.fieldError}>
              {apiError.validationErrors[key][0]}
            </span>
          )}
        </div>
      ))}

      {apiError?.code === 'OUT_OF_DELIVERY_ZONE' && (
        <p className={styles.zoneError} role="alert">
          Esa zona no esta disponible para envio. Cubrimos Mexico
          continental.
        </p>
      )}

      <div className={styles.formActions}>
        <button type="submit" className={styles.btnPrimary} disabled={isActioning}>
          {isActioning ? 'Guardando...' : 'Guardar direccion'}
        </button>
        <button type="button" className={styles.btnSecondary} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function AddressesPage() {
  const dispatch    = useDispatch();
  const queryClient = useQueryClient();

  const { data: addresses = [], isLoading } = useAddresses();
  const isActioning = useSelector((s) => s.addresses?.isActioning);
  const actionError = useSelector((s) => s.addresses?.actionError);
  const lastAction  = useSelector((s) => s.addresses?.lastAction);

  const [editing, setEditing] = useState(null); // null | 'new' | id

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });
  }, [queryClient]);

  const openForm = (idOrNew) => {
    dispatch(clearAddressesActionState());
    setEditing(idOrNew);
  };

  const closeForm = () => {
    dispatch(clearAddressesActionState());
    setEditing(null);
  };

  const handleCreate = async (payload) => {
    const result = await dispatch(createAddress(payload));
    if (createAddress.fulfilled.match(result)) {
      invalidate();
      setEditing(null);
    }
  };

  const handleUpdate = async (id, payload) => {
    const result = await dispatch(updateAddress({ id, payload }));
    if (updateAddress.fulfilled.match(result)) {
      invalidate();
      setEditing(null);
    }
  };

  const handleDelete = async (id) => {
    dispatch(clearAddressesActionState());
    const result = await dispatch(deleteAddress(id));
    if (deleteAddress.fulfilled.match(result)) invalidate();
  };

  const handleSetDefault = async (id) => {
    dispatch(clearAddressesActionState());
    const result = await dispatch(setDefaultAddress(id));
    if (setDefaultAddress.fulfilled.match(result)) invalidate();
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Direcciones de envio</h1>
        <p className={styles.subtitle}>
          Guarda tus direcciones para agilizar el checkout.
        </p>
      </header>

      {lastAction === 'deleted' && !actionError && (
        <p className={styles.success} role="status">
          Direccion eliminada.
        </p>
      )}

      {actionError && editing === null && (
        <p className={styles.error} role="alert">
          {actionError.message || 'No se pudo completar la accion.'}
        </p>
      )}

      {isLoading && (
        <div className={styles.loading} aria-live="polite">
          <p>Cargando direcciones...</p>
        </div>
      )}

      {!isLoading && addresses.length === 0 && editing !== 'new' && (
        <p className={styles.empty}>
          No tienes direcciones guardadas. Agrega una para empezar.
        </p>
      )}

      {editing === 'new' && (
        <AddressForm
          onSubmit={handleCreate}
          onCancel={closeForm}
          isActioning={isActioning}
          apiError={actionError}
        />
      )}

      {!isLoading && addresses.length > 0 && editing !== 'new' && (
        <ul className={styles.list}>
          {addresses.map((addr) => (
            <li key={addr.id} className={styles.item}>
              {editing === addr.id ? (
                <AddressForm
                  initial={addr}
                  isEditing
                  onSubmit={(payload) => handleUpdate(addr.id, payload)}
                  onCancel={closeForm}
                  isActioning={isActioning}
                  apiError={actionError}
                />
              ) : (
                <>
                  <div className={styles.info}>
                    <p className={styles.recipient}>
                      {addr.recipient}
                      {addr.is_default && (
                        <span className={styles.badge}>Predeterminada</span>
                      )}
                    </p>
                    <p className={styles.line}>
                      {[addr.street, addr.exterior_number, addr.interior_number]
                        .filter(Boolean).join(' ')}
                    </p>
                    <p className={styles.line}>
                      {addr.neighborhood}, {addr.city}, {addr.state},{' '}
                      {addr.postal_code}
                    </p>
                    <p className={styles.line}>Tel. {addr.phone}</p>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => openForm(addr.id)}
                    >
                      Editar
                    </button>
                    {!addr.is_default && (
                      <button
                        type="button"
                        className={styles.btnSecondary}
                        onClick={() => handleSetDefault(addr.id)}
                        aria-label={`Hacer predeterminada ${addr.recipient}`}
                      >
                        Hacer predeterminada
                      </button>
                    )}
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => handleDelete(addr.id)}
                      aria-label={`Eliminar direccion ${addr.recipient}`}
                      disabled={isActioning}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!isLoading && editing === null && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => openForm('new')}
          >
            Agregar direccion
          </button>
          <Link to="/account" className={styles.cancelLink}>
            Volver a la cuenta
          </Link>
        </div>
      )}
    </main>
  );
}
