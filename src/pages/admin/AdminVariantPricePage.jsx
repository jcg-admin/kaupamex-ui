/**
 * AdminVariantPricePage — PracticaYoruba
 * UC-CHT-04: Configurar precio diferenciado por variante (Admin).
 *
 * El admin asigna un precio especifico a la variante. Valida que sea
 * un numero >= 0 (BR-001 + Alternativa C "variante gratuita"). Permite
 * tambien quitar el precio diferenciado para volver al precio base
 * del producto (UC-CHT-04 Alternativa A).
 */
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  setVariantPrice,
  clearVariantPrice,
  clearVariantActionState,
} from '@redux/slices/yorubaVariantsSlice';
import styles from './AdminVariantPricePage.module.scss';

const isValidPrice = (raw) => {
  if (raw === '' || raw == null) return false;
  const value = Number(raw);
  return !Number.isNaN(value) && value >= 0;
};

export default function AdminVariantPricePage() {
  const { variantId } = useParams();
  const dispatch = useDispatch();
  const { isActioning, actionError, lastAction } =
    useSelector((s) => s.yorubaVariants);

  const [price,     setPrice]     = useState('');
  const [localError, setLocalError] = useState(null);

  useEffect(() => () => {
    dispatch(clearVariantActionState());
  }, [dispatch]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isValidPrice(price)) {
      setLocalError('El precio debe ser un valor numerico mayor o igual a cero.');
      return;
    }
    setLocalError(null);
    dispatch(setVariantPrice({ variantId, price: Number(price) }));
  };

  const handleClearPrice = () => {
    setLocalError(null);
    dispatch(clearVariantPrice(variantId));
  };

  const errorMessage = localError || (typeof actionError === 'string'
    ? actionError
    : actionError?.detail || null);

  return (
    <section className={styles.page} aria-labelledby="price-title">
      <Link to="/admin/products" className={styles.backLink}>
        ← Volver al catalogo
      </Link>

      <h1 id="price-title" className={styles.title}>
        Precio diferenciado de la variante
      </h1>
      <p className={styles.meta}>Variante #{variantId}</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="price">Precio sin IVA (MXN)</label>
          <input
            id="price"
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {errorMessage && (
          <p role="alert" className={styles.error}>{errorMessage}</p>
        )}

        {lastAction === 'priced' && !errorMessage && (
          <p className={styles.success}>Precio actualizado correctamente.</p>
        )}

        {lastAction === 'price_cleared' && !errorMessage && (
          <p className={styles.success}>
            La variante usa nuevamente el precio base del producto.
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primaryBtn}
            disabled={isActioning}
          >
            {isActioning ? 'Guardando…' : 'Guardar precio'}
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={handleClearPrice}
            disabled={isActioning}
          >
            Quitar precio diferenciado
          </button>
        </div>
      </form>
    </section>
  );
}
