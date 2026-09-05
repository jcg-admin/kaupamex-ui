/**
 * UnauthorizedListener — Kaupamex UI
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
import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { clearError } from '@redux/slices/authSlice';
import { addToast } from '@redux/slices/uiSlice';
import { logError } from '@utils/errorLog';

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
  // Evita mostrar varios avisos si llegan varios 401 en rafaga.
  const noticedRef = useRef(false);

  useEffect(() => {
    function handler() {
      // Limpiar Redux sin llamar al backend.
      dispatch({ type: 'auth/logout/fulfilled', payload: null });
      dispatch(clearError());

      const onProtectedPage = !isPublicPath(location.pathname);

      if (onProtectedPage && !noticedRef.current) {
        // ADR-018: en vez de "sacar" al usuario en silencio, avisar con una
        // ventana (toast) clara de que la sesion expiro. Corrige la queja de
        // "me saca de la pagina" sin contexto.
        noticedRef.current = true;
        logError({
          type: 'auth/session-expired',
          status: 401,
          context: 'auth',
          message: 'Sesion expirada; redirigiendo a login',
          detail: { from: location.pathname },
        });
        dispatch(addToast({
          type: 'warning',
          title: 'Tu sesión expiró',
          message: 'Por seguridad cerramos tu sesión. Vuelve a iniciar sesión para continuar.',
          duration: 6000,
        }));
      }

      if (onProtectedPage) {
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
