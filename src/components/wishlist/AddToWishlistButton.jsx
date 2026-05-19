/**
 * AddToWishlistButton — PracticaYoruba
 * UC-WISH-01: Agregar producto a la lista de deseos.
 *
 * Mostrado en la ficha de producto (ProductPage). Si el usuario no esta
 * autenticado redirige a login. Retroalimentacion visual: el icono
 * cambia para confirmar que el producto fue guardado (RNF Usabilidad).
 */
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  addToWishlist,
  clearWishlistActionState,
} from '@redux/slices/wishlistSlice';
import styles from './AddToWishlistButton.module.scss';

export default function AddToWishlistButton({ productId, variantId = null }) {
  const dispatch        = useDispatch();
  const navigate        = useNavigate();
  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated);
  const isActioning     = useSelector((s) => s.wishlist?.isActioning);
  const actionError     = useSelector((s) => s.wishlist?.actionError);
  const lastAction      = useSelector((s) => s.wishlist?.lastAction);

  const [added, setAdded] = useState(false);

  // Reset el flag local cuando cambia el producto/variante.
  // Si el componente queda montado y solo cambia el param de ruta
  // (p. ej. al navegar a otra ficha), sin esto el boton quedaria
  // deshabilitado para el nuevo producto. Codex review 2026-05-19.
  useEffect(() => {
    setAdded(false);
    dispatch(clearWishlistActionState());
  }, [productId, variantId, dispatch]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/auth/login');
      return;
    }
    dispatch(clearWishlistActionState());
    const result = await dispatch(addToWishlist({ productId, variantId }));
    if (addToWishlist.fulfilled.match(result)) {
      setAdded(true);
    }
  };

  const alreadyInList = actionError?.code === 'PRODUCTO_YA_EN_WISHLIST'
    || actionError?.statusCode === 409;
  const confirmed = added && lastAction === 'added';

  return (
    <div className={styles.wrapper}>
      <button
        type="button"
        className={`${styles.btn} ${confirmed ? styles.added : ''}`}
        onClick={handleClick}
        disabled={isActioning || confirmed}
        aria-pressed={confirmed}
        aria-label={confirmed ? 'Producto en lista de deseos' : 'Agregar a lista de deseos'}
      >
        <span aria-hidden="true" className={styles.icon}>
          {confirmed ? '♥' : '♡'}
        </span>
        <span className={styles.label}>
          {confirmed ? 'En tu lista' : 'Agregar a lista de deseos'}
        </span>
      </button>

      {alreadyInList && !confirmed && (
        <p className={styles.warn} role="status">
          Este producto ya esta en tu lista de deseos.
        </p>
      )}

      {actionError && !alreadyInList && (
        <p className={styles.error} role="alert">
          {actionError.message || 'No se pudo agregar a la lista.'}
        </p>
      )}
    </div>
  );
}
