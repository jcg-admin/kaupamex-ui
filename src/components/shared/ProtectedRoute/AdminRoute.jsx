/**
 * AdminRoute — PracticaYoruba
 * Solo usuarios con is_staff = true. Verifica sesión con /api/v2/auth/me/
 * en el primer montaje para sobrevivir recargas de página.
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated, selectIsAdmin, selectSessionChecked } from '@redux/selectors';
import { checkAuth } from '@redux/slices/authSlice';
import PageLoader from '@components/shared/LazyLoad/PageLoader';

export default function AdminRoute() {
  const dispatch        = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin         = useSelector(selectIsAdmin);
  const sessionChecked  = useSelector(selectSessionChecked);

  useEffect(() => {
    if (!sessionChecked) {
      dispatch(checkAuth());
    }
  }, [dispatch, sessionChecked]);

  if (!sessionChecked) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
}
