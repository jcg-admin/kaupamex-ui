/**
 * ProtectedRoute — PracticaYoruba
 * Requiere autenticación. Verifica sesión con /api/v1/auth/me/ en el
 * primer montaje (cubre recarga de página donde el JWT en memoria se
 * pierde). Redirige a /auth/login si no hay sesión activa.
 */

import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated, selectSessionChecked } from '@redux/selectors';
import { checkAuth } from '@redux/slices/authSlice';
import PageLoader from '@components/shared/LazyLoad/PageLoader';

export default function ProtectedRoute() {
  const dispatch        = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const sessionChecked  = useSelector(selectSessionChecked);
  const location        = useLocation();

  useEffect(() => {
    if (!sessionChecked) {
      dispatch(checkAuth());
    }
  }, [dispatch, sessionChecked]);

  if (!sessionChecked) return <PageLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
