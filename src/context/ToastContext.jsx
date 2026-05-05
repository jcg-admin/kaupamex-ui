/**
 * ToastContext — PracticaYoruba
 * Notificaciones globales (añadir al carrito, errores, éxito de orden, etc.)
 */

import { createContext, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToast, removeToast } from '@redux/slices/uiSlice';
import { selectToasts } from '@redux/selectors';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const dispatch = useDispatch();
  const toasts   = useSelector(selectToasts);

  const toast = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now() + Math.random();
    dispatch(addToast({ id, type, title, message, duration }));
    if (duration > 0) {
      setTimeout(() => dispatch(removeToast(id)), duration);
    }
    return id;
  }, [dispatch]);

  const success = useCallback((title, message, duration) =>
    toast('success', title, message, duration), [toast]);

  const error = useCallback((title, message, duration) =>
    toast('error', title, message, duration), [toast]);

  const warning = useCallback((title, message, duration) =>
    toast('warning', title, message, duration), [toast]);

  const info = useCallback((title, message, duration) =>
    toast('info', title, message, duration), [toast]);

  const dismiss = useCallback((id) => dispatch(removeToast(id)), [dispatch]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss, toasts }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}

export default ToastContext;
