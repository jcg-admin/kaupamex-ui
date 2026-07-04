/**
 * SessionBootstrap — PracticaYoruba UI
 *
 * Rehidrata la sesión UNA sola vez al arrancar la app, en cualquier ruta
 * (pública o protegida). Antes `checkAuth` solo se despachaba dentro de
 * ProtectedRoute/AdminRoute, así que una pestaña nueva que aterrizaba en
 * una ruta pública (p.ej. "/") nunca leía la cookie de sesión compartida
 * y se renderizaba como deslogueada aunque la sesión seguía viva (H-09).
 *
 * Es una lectura de solo-lectura (`GET /api/v2/auth/session/`); NUNCA
 * invalida la sesión ni llama a logout ante un fallo.
 */
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { checkAuth } from '@redux/slices/authSlice';

export default function SessionBootstrap() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  return null;
}
