/**
 * useMenuToggle -- PracticaYoruba
 * Controla el sidebar mobile de la tienda y el panel admin.
 * Sincronizado con uiSlice de Redux.
 */

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  toggleSidebar, openSidebar, closeSidebar,
} from '@redux/slices/uiSlice';
import { selectIsSidebarOpen } from '@redux/selectors';

export function useMenuToggle() {
  const dispatch = useDispatch();
  const isOpen   = useSelector(selectIsSidebarOpen);

  const toggle = useCallback(() => dispatch(toggleSidebar()), [dispatch]);
  const open   = useCallback(() => dispatch(openSidebar()),   [dispatch]);
  const close  = useCallback(() => dispatch(closeSidebar()),  [dispatch]);

  return { isOpen, toggle, open, close };
}

export default useMenuToggle;
