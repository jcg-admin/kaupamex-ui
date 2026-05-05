/**
 * StorefrontLayout — PracticaYoruba
 * Layout público: Header + contenido + Footer.
 * Usado por: HomePage, CatalogPage, ProductPage, CartPage.
 */

import { Outlet } from 'react-router-dom';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import ToastContainer from '@components/common/Toast/ToastContainer';
import ErrorBoundary from '@components/shared/ErrorBoundary';
import styles from './StorefrontLayout.module.scss';

export default function StorefrontLayout() {
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
