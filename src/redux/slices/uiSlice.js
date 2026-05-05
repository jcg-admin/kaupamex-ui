/**
 * UI Slice — PracticaYoruba
 * Estado de la interfaz: sidebar, modals, toasts, darkMode
 */

import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isSidebarOpen:    false,
    isDarkMode:       false,
    isSearchOpen:     false,
    activeModal:      null,   // string: 'auth' | 'address' | 'confirm' | null
    modalProps:       {},
    toasts:           [],
    isPageLoading:    false,
  },
  reducers: {
    toggleSidebar(state)       { state.isSidebarOpen = !state.isSidebarOpen; },
    closeSidebar(state)        { state.isSidebarOpen = false; },
    openSidebar(state)         { state.isSidebarOpen = true; },
    toggleDarkMode(state)      { state.isDarkMode = !state.isDarkMode; },
    toggleSearch(state)        { state.isSearchOpen = !state.isSearchOpen; },
    closeSearch(state)         { state.isSearchOpen = false; },

    openModal(state, action) {
      state.activeModal = action.payload.modal;
      state.modalProps  = action.payload.props ?? {};
    },
    closeModal(state) {
      state.activeModal = null;
      state.modalProps  = {};
    },

    addToast(state, action) {
      const { id = Date.now(), type = 'info', title, message, duration = 4000 } = action.payload;
      state.toasts.push({ id, type, title, message, duration });
    },
    removeToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },

    setPageLoading(state, action) { state.isPageLoading = action.payload; },
  },
});

export const {
  toggleSidebar, closeSidebar, openSidebar,
  toggleDarkMode, toggleSearch, closeSearch,
  openModal, closeModal,
  addToast, removeToast,
  setPageLoading,
} = uiSlice.actions;

export default uiSlice.reducer;

// Selectors
export const selectIsSidebarOpen = (state) => state.ui.isSidebarOpen;
