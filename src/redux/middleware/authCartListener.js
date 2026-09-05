/**
 * authCartListener — Kaupamex (CR-1/CR-2, ADR-018 hotfix)
 *
 * Al iniciar sesion (``loginUser.fulfilled``), fusiona el carrito anonimo
 * (``X-Cart-Token``) en la cuenta y recarga el carrito del usuario. Se hace de
 * forma central con un listener middleware para cubrir TODOS los entry-points
 * de login (LoginPage, hook useAuth, etc.) sin repetir el wiring en cada uno.
 *
 * Antes nadie disparaba ``syncCartOnLogin``: los items anonimos quedaban
 * huerfanos y el carrito se veia vacio tras el login.
 */
import { createListenerMiddleware } from '@reduxjs/toolkit';

import apiService from '@services/apiService';
import { loginUser } from '@redux/slices/authSlice';
import { syncCartOnLogin, fetchCart } from '@redux/slices/cartSlice';

export const authCartListener = createListenerMiddleware();

authCartListener.startListening({
  actionCreator: loginUser.fulfilled,
  effect: async (_action, api) => {
    // Solo fusiona si hay carrito anonimo pendiente. syncCartOnLogin envia el
    // cart_token y limpia el token tras exito (deja de reenviarse ya logueado).
    if (apiService.getCartToken()) {
      await api.dispatch(syncCartOnLogin());
    }
    // Cargar el carrito del usuario (fusionado, o el suyo si no habia anonimo).
    await api.dispatch(fetchCart());
  },
});

export default authCartListener.middleware;
