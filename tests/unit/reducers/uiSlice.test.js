/**
 * Tests — uiSlice reducer
 * PracticaYoruba UI
 */

import uiReducer, {
  toggleSidebar, closeSidebar, openSidebar,
  toggleSearch, closeSearch,
  openModal, closeModal,
  addToast, removeToast,
  setPageLoading,
} from '../../../src/redux/slices/uiSlice';

const INITIAL_STATE = {
  isSidebarOpen: false,
  isDarkMode:    false,
  isSearchOpen:  false,
  activeModal:   null,
  modalProps:    {},
  toasts:        [],
  isPageLoading: false,
};

describe('uiSlice', () => {
  it('debe devolver el estado inicial', () => {
    expect(uiReducer(undefined, { type: '@@INIT' })).toEqual(INITIAL_STATE);
  });

  describe('sidebar', () => {
    it('toggleSidebar debe alternar el estado', () => {
      let state = uiReducer(INITIAL_STATE, toggleSidebar());
      expect(state.isSidebarOpen).toBe(true);
      state = uiReducer(state, toggleSidebar());
      expect(state.isSidebarOpen).toBe(false);
    });

    it('openSidebar debe abrir el sidebar', () => {
      const state = uiReducer(INITIAL_STATE, openSidebar());
      expect(state.isSidebarOpen).toBe(true);
    });

    it('closeSidebar debe cerrar el sidebar', () => {
      const openState = { ...INITIAL_STATE, isSidebarOpen: true };
      const state = uiReducer(openState, closeSidebar());
      expect(state.isSidebarOpen).toBe(false);
    });
  });

  describe('búsqueda', () => {
    it('toggleSearch debe alternar la búsqueda', () => {
      const state = uiReducer(INITIAL_STATE, toggleSearch());
      expect(state.isSearchOpen).toBe(true);
    });

    it('closeSearch debe cerrar la búsqueda', () => {
      const openState = { ...INITIAL_STATE, isSearchOpen: true };
      const state = uiReducer(openState, closeSearch());
      expect(state.isSearchOpen).toBe(false);
    });
  });

  describe('modales', () => {
    it('openModal debe establecer el modal activo y sus props', () => {
      const state = uiReducer(INITIAL_STATE, openModal({ modal: 'auth', props: { redirect: '/checkout' } }));
      expect(state.activeModal).toBe('auth');
      expect(state.modalProps).toEqual({ redirect: '/checkout' });
    });

    it('closeModal debe limpiar el modal', () => {
      const openState = { ...INITIAL_STATE, activeModal: 'auth', modalProps: { x: 1 } };
      const state = uiReducer(openState, closeModal());
      expect(state.activeModal).toBeNull();
      expect(state.modalProps).toEqual({});
    });
  });

  describe('toasts', () => {
    it('addToast debe agregar una notificación', () => {
      const toast = { id: 1, type: 'success', title: 'Añadido', message: 'Collar al carrito' };
      const state = uiReducer(INITIAL_STATE, addToast(toast));
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0]).toEqual(expect.objectContaining(toast));
    });

    it('removeToast debe eliminar por id', () => {
      const state1 = uiReducer(INITIAL_STATE, addToast({ id: 1, type: 'info', title: 'A' }));
      const state2 = uiReducer(state1, addToast({ id: 2, type: 'error', title: 'B' }));
      const state3 = uiReducer(state2, removeToast(1));

      expect(state3.toasts).toHaveLength(1);
      expect(state3.toasts[0].id).toBe(2);
    });
  });

  describe('isPageLoading', () => {
    it('setPageLoading debe actualizar el flag', () => {
      let state = uiReducer(INITIAL_STATE, setPageLoading(true));
      expect(state.isPageLoading).toBe(true);
      state = uiReducer(state, setPageLoading(false));
      expect(state.isPageLoading).toBe(false);
    });
  });
});
