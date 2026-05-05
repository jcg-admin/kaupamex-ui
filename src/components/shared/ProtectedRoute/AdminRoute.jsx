/**
 * AdminRoute — PracticaYoruba
 * Solo usuarios con is_staff = true. Redirige al inicio si no es admin.
 */

import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated, selectIsAdmin, selectAuthLoading } from '@redux/selectors';
import PageLoader from '@components/shared/LazyLoad/PageLoader';

export default function AdminRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin         = useSelector(selectIsAdmin);
  const isLoading       = useSelector(selectAuthLoading);

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
