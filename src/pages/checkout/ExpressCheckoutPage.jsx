/**
 * ExpressCheckoutPage — Práctica Yorùbà
 * One-click checkout stub — fetchExpressEligibility/submitExpress not yet
 * implemented in checkoutSlice. Page always redirects to normal checkout.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchCart } from '@redux/slices/cartSlice';
import { Button } from '@components/common/primitives';
import styles from './ExpressCheckoutPage.module.scss';

export default function ExpressCheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  // Express eligibility check pending implementation — always redirect to standard checkout.
  const eligibility = null;

  if (!eligibility?.eligible) {
    return (
      <main className={styles.page}>
        <div className={styles.notEligible}>
          <h2>Necesitas un pedido más para checkout express</h2>
          <p>El express checkout está disponible para clientes con al menos un pedido previo entregado.</p>
          <Button variant="primary" onClick={() => navigate('/checkout')}>
            Ir al checkout normal
          </Button>
        </div>
      </main>
    );
  }

  return null;
}
