/**
 * ProtectedRoute — PracticaYoruba
 * Requiere autenticación. Si no está autenticado, redirige a /auth/login
 * preservando la ruta original en el state para redirigir al volver.
 */

import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectAuthLoading } from '@redux/selectors';
import PageLoader from '@components/shared/LazyLoad/PageLoader';

export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading       = useSelector(selectAuthLoading);
  const location        = useLocation();

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
