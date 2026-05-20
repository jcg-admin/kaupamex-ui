/**
 * UnauthorizedListener — PracticaYoruba UI
 *
 * Escucha el evento global ``py:unauthorized`` que ``apiService``
 * dispara cuando el backend responde 401. Cuando llega:
 *
 *   1. Limpia el estado de auth de Redux (user=null, isAuthenticated=false)
 *      sin pegarle a /logout/ del backend (el JWT ya esta invalido y la
 *      llamada solo agregaria otro 401).
 *   2. Redirige a /auth/login dejando el path actual en `state.from`
 *      para que LoginPage pueda re-redirigir tras login exitoso.
 *
 * Cubre el escenario de UC-AUTH-16 + UC-AUTH-13:
 * un comprador que dejo una tab abierta cuando otro flujo (admin
 * suspend, self-deactivate desde otra ventana, o expiracion de
 * refresh token) invalido su sesion. Antes de este componente, la tab
 * vieja seguia en una pantalla "logueada" pero todas las peticiones
 * fallaban silenciosamente con 401.
 */
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { clearError } from '@redux/slices/authSlice';

// Path-prefix de rutas publicas — no redirigimos al login si el
// usuario ya esta en ellas (evita loop /auth/login -> /auth/login).
const PUBLIC_PATHS = ['/auth/', '/'];

function isPublicPath(pathname) {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p),
  );
}

export default function UnauthorizedListener() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    function handler() {
      // Limpiar Redux sin llamar al backend.
      dispatch({ type: 'auth/logout/fulfilled', payload: null });
      dispatch(clearError());

      if (!isPublicPath(location.pathname)) {
        navigate('/auth/login', {
          replace: true,
          state: { from: location.pathname },
        });
      }
    }

    window.addEventListener('py:unauthorized', handler);
    return () => window.removeEventListener('py:unauthorized', handler);
  }, [dispatch, navigate, location.pathname]);

  return null;
}
