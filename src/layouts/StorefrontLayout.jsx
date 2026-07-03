/**
 * StorefrontLayout — PracticaYoruba
 * Layout público: Header + contenido + Footer.
 * Usado por: HomePage, CatalogPage, ProductPage, CartPage.
 */

import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import ToastContainer from '@components/common/Toast/ToastContainer';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import { fetchWishlist } from '@redux/slices/wishlistSlice';
import styles from './StorefrontLayout.module.scss';

export default function StorefrontLayout() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth?.isAuthenticated);

  // Hidrata la wishlist en Redux al autenticarse, para que el corazón de
  // ProductCard refleje el estado real y toggleWishlist decida add/remove
  // correctamente (antes items quedaba vacío fuera de WishlistPage → el
  // toggle siempre reintentaba "add" y el backend respondía 409).
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchWishlist());
  }, [isAuthenticated, dispatch]);

  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.main}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <Footer />
      <ToastContainer />
    </div>
  );
}
